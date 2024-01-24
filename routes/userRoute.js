import express from 'express';

import {
  getAllUsers,
  createUser,
  getUser,
  isEmailExist,
  isUserNameExist,
  getTreeStructure,
  createChildren,
  getUserNodeWithChildren,
  getNetworkNodeList,
  createFloater,
  fetchFloaterData,
  getMySponseelist
} from '../controllers/userController.js';

import { authenticateUserMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/list', authenticateUserMiddleware, getAllUsers);

router.post('/getMySponseelist', authenticateUserMiddleware, getMySponseelist);
router.post('/create', authenticateUserMiddleware, createUser);
router.get('/:userId', authenticateUserMiddleware, getUser);

router.post('/isEmailExist', isEmailExist);
router.post('/isUserNameExist', isUserNameExist);

router.post('/getTreeStructure', authenticateUserMiddleware, getTreeStructure);

router.post('/createChildren', authenticateUserMiddleware, createChildren);
router.post(
  '/getUserNodeWithChildren',
  authenticateUserMiddleware,
  getUserNodeWithChildren
);
router.post(
  '/getNetworkNodeList',
  authenticateUserMiddleware,
  getNetworkNodeList
);

router.post('/createFloater', authenticateUserMiddleware, createFloater);

router.post('/listFloaterData', authenticateUserMiddleware, fetchFloaterData);

export default router;
