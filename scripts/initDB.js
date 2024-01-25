import { v4 as uuidv4 } from 'uuid';
import ShortUniqueId from 'short-unique-id';
import {
  createNewCode,
  createCodeType,
  createCodeBundle
} from '../cypher/code.js';
import { createPackage } from '../cypher/package.js';

import config from '../config.js';
const { cypherQuerySession } = config;
import { addUserQuery } from '../cypher/user.js';
const amuletPackage = [
  { name: 'package_10', displayName: 'Silver (Php 10,000)', points: 1000 },
  { name: 'package_50', displayName: 'Gold (Php 50,000)', points: 5000 },
  { name: 'package_100', displayName: 'Diamond (Php 100,000)', points: 10000 }
];

const codeType = [
  { name: 'FREE_SLOT', displayName: 'Free Slot', isActiveForDailyBonus: false },
  { name: 'REGULAR', displayName: 'Regular', isActiveForDailyBonus: true }
];

const userDisplayIdGenerator = () => {
  const { randomUUID } = new ShortUniqueId({ length: 5 });
  let currentYear = new Date().getFullYear();

  let displayId = `AM_OPC-${currentYear}-${randomUUID()}`;
  // check if exists in db

  return displayId;
};

const createRootNodeForAll = async () => {
  let rootUser = {
    formId: 'Admin001',
    email: 'admin@amuletinternationalopc.com',
    password: 'root2024admin',
    userName: 'adminRootAccount',
    lastName: 'Digamon',
    firstName: 'Lowelyn',
    middleName: 'D',
    address: 'Bobontugan, Jasaan, Misamis Oriental 9003',
    birthday: '',
    age: '',
    civilStatus: 'Single',
    mobileNumber: '+63 927 425 0861',
    telephoneNumber: '',
    beneficiaryRelationship: '',
    date_sign: new Date().toISOString().slice(0, 10),
    sponsorName: '',
    sponsorIdNumber: '',
    placementName: '',
    placementIdNumber: '',
    signatureOfSponsor: '',
    signatureOfApplicant: '',
    check: '',
    amount: '',
    cash: '',
    paymentMethod: 'cash',
    signature: '',
    chequeNumber: '',
    amountInWords: '',
    amountInNumber: '',
    parentID: false,
    amulet_package: 'package_100'
  };

  let otherProps = {
    ID: uuidv4(),
    name: `${rootUser.firstName} ${rootUser.lastName}`,
    date_created: Date.now(),
    displayID: userDisplayIdGenerator(),
    role: 'ADMIN',
    isRootNode: true,
    ID_ALIAS: 'LVL_1_INDEX_1',
    INDEX_PLACEMENT: 1,
    DEPTH_LEVEL: 1
  };

  let formattedData = {
    ...rootUser,
    ...otherProps
  };

  let createdUser = await cypherQuerySession.executeQuery(
    addUserQuery({
      ...formattedData
    })
  );

  console.log('root node created');
};
export const initDB = async () => {
  await createRootNodeForAll();
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
