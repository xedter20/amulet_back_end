import { createPackage, getPackage } from '../cypher/package.js';

import config from '../config.js';
const { cypherQuerySession } = config;
import { v4 as uuidv4 } from 'uuid';

export const packageRepo = {
  listPackage: async () => {
    let { records } = await cypherQuerySession.executeQuery(getPackage());
    const [packageList] = records[0]._fields;

    return packageList;
  }
};
