import { listCodeType } from '../cypher/code.js';

import config from '../config.js';
const { cypherQuerySession } = config;

export const codeTypeRepo = {
  listCodeType: async () => {
    let { records } = await cypherQuerySession.executeQuery(listCodeType());
    const [packageList] = records[0]._fields;

    return packageList;
  }
};
