import express from 'express';

import {
  generateCodeBundle,
  getCodeList,
  getPendingCodeList,
  sendConfirmationForApproval,
  approveConfirmationLink
} from '../controllers/codeController.js';

import { authenticateUserMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/generateCodeBundle',
  // authenticateUserMiddleware,
  generateCodeBundle
);

router.post(
  '/getCodeList',
  // authenticateUserMiddleware,
  getCodeList
);

router.post(
  '/getPendingCodeList',
  // authenticateUserMiddleware,
  getPendingCodeList
);

router.post(
  '/sendConfirmationForApproval',
  // authenticateUserMiddleware,
  sendConfirmationForApproval
);

router.get(
  '/approveConfirmationLink',
  // authenticateUserMiddleware,
  approveConfirmationLink
);

export default router;
