import { addIncome, getIncome } from '../cypher/incomeSales.js';

import config from '../config.js';
const { cypherQuerySession } = config;

export const incomeSalesRepo = {
  addIncome: async data => {
    if (data.type === 'DAILY_BONUS') {
      let dateNow = new Date();
      let dateIdentifier = dateNow.toISOString().split('T')[0];

      let year = new Date().getFullYear();

      // get the current data

      let { records } = await cypherQuerySession.executeQuery(
        getIncome(`${year}`)
      );

      let dateList = [
        {
          dateTimeAdded: Date.now(),
          dateIdentifier,
          amountInPhp: data.amountInPhp
        }
      ];
      if (records.length > 0) {
        let result = records[0]._fields;
        let current = result[0];

        dateList = JSON.parse(current.dateList);

        let mapped = dateList.find(current => {
          return current.dateIdentifier === dateIdentifier;
        });

        if (!mapped && !mapped.dateIdentifier) {
          dateList.push({
            dateTimeAdded: Date.now(),
            dateIdentifier,
            amountInPhp: data.amountInPhp
          });
        }
      }

      let updatedData = {
        ...data,
        dateList,
        year
      };

      await cypherQuerySession.executeQuery(
        addIncome({
          ...updatedData,
          relatedEntityID: `${year}`
        })
      );
    } else {
      await cypherQuerySession.executeQuery(addIncome(data));
    }
  }
};
