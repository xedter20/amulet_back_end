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
    const getPairingNodeQuery = await cypherQuerySession.executeQuery(
      getPairingNode({
        userId: loggedInUser.ID,
        status: 'COMPLETED'
      })
    );
    let matchedPairs = getPairingNodeQuery.records[0]._fields[0];

    const totalIncome = matchedPairs.reduce((acc, current) => {
      return acc + current.gainedAmount.low;
    }, 0);

    let data = { totalIncome };

    res.json({ success: true, data });
  } catch (error) {
    res.status(400).send(error.message);
  }
};
