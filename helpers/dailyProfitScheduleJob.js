import cron from 'node-cron';
import { codeTypeRepo } from '../repository/codeType.js';
import config from '../config.js';

import { packageRepo } from '../repository/package.js';

import { incomeSalesRepo } from '../repository/incomeSales.js';
import { v4 as uuidv4 } from 'uuid';
let incomeV = {
  type:
    'DAILY_BONUS' ||
    'MATCH_SALES' ||
    'GIFT_CHEQUE' ||
    'DIRECT_REFERAL' ||
    'DIRECT_SPONSORSHIP',
  dateInserted: Date.now(),
  relatedEntityID: '',
  userID: '',
  amount: ''
};

export const dailyProfitScheduleJob = async () => {
  let packageList = await packageRepo.listPackage();
  let listCodeTypeList = await codeTypeRepo.listCodeType();

  let codes = await codeTypeRepo.getCodeListForDailyProfit();

  await Promise.all(
    codes.map(async ({ packageType, userID, codeTypeName }) => {
      let foundAmuletPackage = packageList.find(p => {
        return p.name === packageType;
      });

      let codeType = listCodeTypeList.find(ct => {
        return ct.name === codeTypeName;
      });

      let dailyBonusAmount =
        foundAmuletPackage && foundAmuletPackage.dailyBonusAmount;
      let isActiveForDailyBonus = codeType && codeType.isActiveForDailyBonus;

      if (isActiveForDailyBonus) {
        // create DailBonusV
        incomeSalesRepo.addIncome({
          ID: uuidv4(),
          type: 'DAILY_BONUS',
          userID: userID,
          dateTimeAdded: Date.now(),
          relatedEntityID: '',
          amountInPhp: dailyBonusAmount
        });
      } else {
      }
    })
  );

  // cron.schedule('* * * * *', async () => {
  //   // 1. get all code coupon with status = 'USED' and have userID property

  // });
};
