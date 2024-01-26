import express from 'express';

import {
  approvedMatching,
  getDashboardStats,
  recievedDailyBonus
} from '../controllers/transactionController.js';

import { authenticateUserMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/approvedMatching', authenticateUserMiddleware, approvedMatching);

router.post(
  '/getDashboardStats',
  authenticateUserMiddleware,
  getDashboardStats
);

router.post(
  '/recievedDailyBonus',
  authenticateUserMiddleware,
  recievedDailyBonus
);

export default router;
