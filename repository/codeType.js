import {
  listCodeType,
  listCodes,
  listPendingCode,
  updatePendingCodes
} from '../cypher/code.js';

import config from '../config.js';
const { cypherQuerySession } = config;

import neo4j from 'neo4j-driver';
const transformIntegers = function (result) {
  let updatedData = result.map(entryObjects => {
    let keyys = Object.keys(entryObjects);

    let mappeObjectKey = keyys.reduce((acc, key) => {
      let value = neo4j.isInt(entryObjects[key])
        ? neo4j.integer.inSafeRange(entryObjects[key])
          ? entryObjects[key].toNumber()
          : entryObjects[key].toString()
        : entryObjects[key];

      return { ...acc, [key]: value };
    }, {});

    return mappeObjectKey;
  });

  return updatedData;
};

export const codeTypeRepo = {
  listCodeType: async () => {
    let { records } = await cypherQuerySession.executeQuery(listCodeType());
    const [packageList] = records[0]._fields;

    return packageList;
  },
  listCode: async () => {
    let { records } = await cypherQuerySession.executeQuery(
      listCodes({
        isApproved: true
      })
    );

    const [list] = records[0]._fields;

    let data = transformIntegers(list);

    return data;
  },
  listPendingCode: async () => {
    let { records } = await cypherQuerySession.executeQuery(
      listPendingCode({
        isApproved: false
      })
    );

    const [list] = records[0]._fields;

    let data = transformIntegers(
      list.map(data => {
        let codeList = transformIntegers(data.codeList);

        return {
          ...data,
          codeList
        };
      })
    );

    return data;
  },
  updatePendingCodes: async ({ bundleId, isApproved = true }) => {
    let { records } = await cypherQuerySession.executeQuery(
      updatePendingCodes({ bundleId, isApproved })
    );
  }
};
