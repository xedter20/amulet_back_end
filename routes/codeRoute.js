import express from 'express';

import { generateCodeBundle } from '../controllers/codeController.js';

import { authenticateUserMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/generateCodeBundle',
  // authenticateUserMiddleware,
  generateCodeBundle
);
export default router;
