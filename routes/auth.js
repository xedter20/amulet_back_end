import express from 'express';

import {
  findUserByIdQuery,
  addUserQuery,
  createRelationShipQuery,
  getTreeStructureQuery,
  getChildren,
  findUserByEmailQuery,
  findUserByUserNameQuery,
  findUserQuery
} from '../cypher/user.js';

import config from '../config.js';

import { generateAccessToken } from '../helpers/generateAccessToken.js';

const { cypherQuerySession } = config;

const router = express.Router();

router.post('/login', async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    let { records } = await cypherQuerySession.executeQuery(
      findUserByEmailQuery(email)
    );

    const user = records[0]._fields[0];

    const foundUser = user.find(u => {
      return u.email === email && u.password === password;
    });

    if (foundUser) {
      let { email, ID, role } = foundUser;

      let token = await generateAccessToken({ email, ID, role });

      res.json({
        success: true,
        token: token,
        data: {
          role: foundUser.role,
          id: foundUser.id,
          email: foundUser.email
        }
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'wrong_credentials'
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send('Something went wrong');
  }
});

export default router;
