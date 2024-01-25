import cron from 'node-cron';

import config from '../config.js';

export const dailyProfitScheduleJob = () => {
  console.log('Dex');
  cron.schedule('* * * * *', () => {
    console.log('running a task every minute');
  });
};
