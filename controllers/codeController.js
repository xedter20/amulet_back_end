import { v4 as uuidv4 } from 'uuid';

import {
  createNewCode,
  createCodeType,
  createCodeBundle
} from '../cypher/code.js';

import { getPackage } from '../cypher/package.js';

import config from '../config.js';

const { cypherQuerySession } = config;
import ShortUniqueId from 'short-unique-id';

import { packageRepo } from '../repository/package.js';

const generateCode = ({
  bundleId,
  codeType = 'FREE_SLOT' || 'REGULAR',
  packageType
}) => {
  // codeTypeV -[:has_bundle]-> bundleV  [has_code -> codeV
  if (codeType === 'FREE_SLOT') {
    // send email to admin to confirm
  }

  const { randomUUID } = new ShortUniqueId({ length: 6 });

  return {
    code: randomUUID(),
    bundleId: bundleId,
    dateTimeAdded: Date.now(),
    dateTimeUpdated: Date.now(),
    status: 'AVAILABLE', // 'AVAILABLE' || 'USED',
    type: codeType, //'FREE_SLOT' || 'REGULAR', // from UI
    userID: '', // from UI
    directSponsorId: '', // from UI
    packageType, // from UI
    isActiveForDailyBonus: codeType === 'REGULAR'
  };
};

export const generateCodeBundle = async (req, res, next) => {
  try {
    let { codeType, packageType, quantity } = req.body;
    // get packageType data in DB

    let packageList = await packageRepo.listPackage();
    let selectedPackage = packageList.find(p => {
      return p.name === packageType;
    });

    let bundleId = uuidv4();
    // create codeTypeV
    // create bundleV
    // create codeV
    let codeList = Array.from(Array(parseInt(quantity)), (_, val) => val).map(
      value => {
        let newCode = generateCode({
          bundleId,
          codeType,
          packageType: selectedPackage.name
        });

        return { ...newCode };
      }
    );

    await cypherQuerySession.executeQuery(
      createCodeType({
        codeType: codeType,
        data: {
          ID: uuidv4(),
          codeType
        }
      })
    );

    await cypherQuerySession.executeQuery(
      createCodeBundle({
        bundleId: bundleId,
        name: codeType
      })
    );
    await Promise.all(
      codeList.map(async data => {
        let { type, bundleId } = data;

        await cypherQuerySession.executeQuery(
          createNewCode({
            name: type,
            bundleId,
            codeData: data
          })
        );
      })
    );

    res.json({ success: true, codeList });
  } catch (error) {
    res.status(400).send(error.message);
  }
};
