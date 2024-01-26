import { v4 as uuidv4 } from 'uuid';

import {
  getAllParentNodes,
  checkIfMatchExist,
  addPairingNode,
  getAllMatchPairById,
  checkIfPairExist,
  getPairingNode,
  updatePairingNode
} from '../cypher/transaction.js';

import config from '../config.js';

import { incomeSalesRepo } from '../repository/incomeSales.js';

const { cypherQuerySession } = config;

const addProfit = async ({
  ID,
  isApproved,
  approverUserId,
  approvalDate,
  previousProfit,
  totalAmount = 1000
}) => {
  let data = {
    ID,
    status: isApproved ? 'COMPLETED' : 'PENDING',
    approverUserId,
    approvalDate,
    gainedAmount: totalAmount
  };
  const updatePairingNodeQuery = await cypherQuerySession.executeQuery(
    updatePairingNode(data)
  );

  console.log('success');
};

export const approvedMatching = async (req, res, next) => {
  try {
    const ID = req.body.ID;
    let loggedInUser = req.user;

    const getPairingNodeQuery = await cypherQuerySession.executeQuery(
      getPairingNode({
        ID: ID
      })
    );
    let { status } = getPairingNodeQuery.records[0]._fields[0];

    if (status === 'PENDING') {
      await addProfit({
        ID,
        isApproved: true,
        approverUserId: loggedInUser.ID,
        approvalDate: Date.now(),
        totalAmount: 1000
      });
      res.json({ success: true, ID });
    } else {
      res.json({ success: true, ID });
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    let loggedInUser = req.user;

    let dailyBonusList = await incomeSalesRepo.getIncomeByType({
      type: 'DAILY_BONUS'
    });

    let totalAmount = dailyBonusList.reduce((acc, current) => {
      let dateList = JSON.parse(current.dateList);

      let total = dateList
        .filter(t => {
          return t && t.isRecieved;
        })
        .reduce((acc, current) => {
          return acc + current.amountInPhp;
        }, 0);

      return acc + total;
    }, 0);

    let data = {
      dailyBonus: {
        totalAmount: totalAmount,
        dailyBonusList
      }
    };

    console.log(data);

    res.json({ success: true, data });
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
};

export const recievedDailyBonus = async (req, res, next) => {
  try {
    let loggedInUser = req.user;

    let { ID, newData } = req.body;

    await incomeSalesRepo.recievedDailyBonus({
      ID,
      newData
    });

    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
};
