import {
  createNewCode,
  createCodeType,
  createCodeBundle
} from '../cypher/code.js';
import { createPackage } from '../cypher/package.js';

import config from '../config.js';
const { cypherQuerySession } = config;
import { v4 as uuidv4 } from 'uuid';

const amuletPackage = [
  { name: 'package_10', displayName: 'Silver (Php 10,000)', points: 1000 },
  { name: 'package_50', displayName: 'Gold (Php 50,000)', points: 5000 },
  { name: 'package_100', displayName: 'Diamond (Php 100,000)', points: 10000 }
];

const codeType = [
  { name: 'FREE_SLOT', displayName: 'Free Slot', isActiveForDailyBonus: false },
  { name: 'REGULAR', displayName: 'Regular', isActiveForDailyBonus: true }
];

export const initDB = async () => {
  await Promise.all(
    amuletPackage.map(async p => {
      let codeType = p.name;

      await cypherQuerySession.executeQuery(
        createPackage({
          name: codeType,
          data: {
            ID: uuidv4(),
            ...p
          }
        })
      );
    })
  );

  await Promise.all(
    codeType.map(async ct => {
      let codeType = ct.name;

      await cypherQuerySession.executeQuery(
        createCodeType({
          codeType: codeType,
          data: {
            ID: uuidv4(),
            name: codeType,
            ...ct
          }
        })
      );
    })
  );
  console.log('DONE');
};
