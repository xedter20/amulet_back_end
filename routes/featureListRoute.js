import express from 'express';

import { featureList } from '../controllers/featureListController.js';

import { authenticateUserMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/list',
  // authenticateUserMiddleware,
  featureList
);

export default router;
