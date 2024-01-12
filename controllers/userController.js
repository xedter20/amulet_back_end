import firebase from '../firebase.js';
import userModel from '../models/userModel.js';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';

const db = getFirestore(firebase);
import { v4 as uuidv4 } from 'uuid';

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
import {
  getAllParentNodes,
  checkIfMatchExist,
  addPairingNode,
  getAllMatchPairById,
  checkIfPairExist
} from '../cypher/transaction.js';

import config from '../config.js';

const { cypherQuerySession } = config;

const getAllPossibleMatch = ({ depthLevel }) => {
  const countTotalChildrenNodes = depthLevel => {
    return 1 * Math.pow(2, depthLevel);
  };

  let childTotal = countTotalChildrenNodes(depthLevel);

  let countLeft = 0;
  let countRight = 0;
  let childrenSize = childTotal; //EXPECTED CHILDREN IN THE DEPTH LEVEL let combinations = [];
  let combinations = [];
  let combinations_ = [];
  let combinationsGeneral_ = [];
  let generalCount = 1;

  for (let index = 0; index < childrenSize; index++) {
    let last = index + 1;
    //Linear Prediction
    if (last % 2 === 0) {
      let leftAlias = `LVL_${depthLevel + 1}_INDEX_${index}`;
      let rightAlias = `LVL_${depthLevel + 1}_INDEX_${last}`;
      combinations.push([leftAlias, rightAlias]);
      // combinations.push(index + '=' + last);
    }

    if (depthLevel > 1) {
      //Left Prediction
      if (last % 2 === 1) {
        if (countLeft % 2 === 0) {
          let leftAlias = `LVL_${depthLevel + 1}_INDEX_${last}`;
          let rightAlias = `LVL_${depthLevel + 1}_INDEX_${last + 2}`;
          // combinations_.push(last + '=' + (last + 2));
          combinations_.push([leftAlias, rightAlias]);
        }
        countLeft++;
      }

      //Right Prediction
      if (last % 2 === 0) {
        if (countLeft % 2 === 1) {
          let leftAlias = `LVL_${depthLevel + 1}_INDEX_${last}`;
          let rightAlias = `LVL_${depthLevel + 1}_INDEX_${last + 2}`;
          // combinations_.push(last + '=' + (last + 2));
          combinations_.push([leftAlias, rightAlias]);
        }

        countRight++;
      }
    }
    //Parent Prediction
    if (index < childrenSize / 2) {
      let leftAlias = `LVL_${depthLevel + 1}_INDEX_${generalCount}`;
      let rightAlias = `LVL_${depthLevel + 1}_INDEX_${
        childrenSize - childrenSize / 2 + generalCount
      }`;

      combinationsGeneral_.push([leftAlias, rightAlias]);

      // combinationsGeneral_.push(
      //   generalCount + '=' + (childrenSize - childrenSize / 2 + generalCount)
      // );
      generalCount++;
    }
  }

  // console.log('Combinations in Linear : ', combinations);
  // console.log('Combinations in Left and Right: ', combinations_);

  let allCombinations = [...combinations, ...combinations_];
  if (childrenSize / 2 > 2) {
    allCombinations = [...allCombinations, ...combinationsGeneral_];
    // console.log('Combinations in Parent', combinationsGeneral_);
  }

  return allCombinations;
};

const prepareDataBeforeInsertion = ({
  depthLevel,
  sourceIndexPosition,
  position
}) => {
  const createAlias = () => {
    let nextPositionIndex;
    let nextAlias = `LVL_${depthLevel + 1}`;
    if (position === 'LEFT') {
      let diff = sourceIndexPosition - 1;

      nextPositionIndex = sourceIndexPosition + diff;
      nextAlias = `${nextAlias}_INDEX_${nextPositionIndex}`;
    } else {
      let diff = sourceIndexPosition + 1 - 1;

      nextPositionIndex = sourceIndexPosition + diff;
      nextAlias = `${nextAlias}_INDEX_${nextPositionIndex}`;
    }

    return {
      nextPositionIndex,
      nextAlias
    };
  };

  // return createAlias({
  //   depthLevel: 1,
  //   sourceIndexPosition: 1,
  //   position: 'RIGHT'
  // });

  let allPossibleCombination = getAllPossibleMatch({ depthLevel });

  return {
    allPossibleCombination: allPossibleCombination,
    newlyAddedUserAlias: createAlias()
  };
};

export const createUser = async (req, res, next) => {
  try {
    const data = req.body;

    const { firstName, lastName, email, position, parentNodeID } = data;

    let formData = {
      ...data,
      ID: uuidv4(),
      name: `${firstName} ${lastName}`,
      date_created: Date.now()
    };

    let { records } = await cypherQuerySession.executeQuery(
      findUserByIdQuery(parentNodeID)
    );
    const [user] = records[0]._fields[0];
    let depthLevel = user?.DEPTH_LEVEL.low || 1;
    let sourceIndexPosition = user?.INDEX_PLACEMENT.low || 1;

    let nodeLogicProps = {};

    if (email === 'dextermiranda441@gmail.com') {
      formData = {
        ...formData,
        role: 'ADMIN',
        isRootNode: true,
        ID_ALIAS: 'LVL_1_INDEX_1',
        INDEX_PLACEMENT: 1,
        DEPTH_LEVEL: 1
      };
    } else {
      nodeLogicProps = prepareDataBeforeInsertion({
        depthLevel: depthLevel,
        sourceIndexPosition: sourceIndexPosition,
        position: position
      });

      formData = {
        ...formData,
        isRootNode: false,
        DEPTH_LEVEL: depthLevel + 1,
        ID_ALIAS: nodeLogicProps.newlyAddedUserAlias.nextAlias,
        INDEX_PLACEMENT: nodeLogicProps.newlyAddedUserAlias.nextPositionIndex,
        parentID: parentNodeID || ''
      };
    }

    let { allPossibleCombination } = nodeLogicProps;

    let createdUser = await cypherQuerySession.executeQuery(
      addUserQuery({
        ...formData
      })
    );

    if (position && parentNodeID) {
      const result = createdUser.records[0]._fields[0];

      await cypherQuerySession.executeQuery(
        createRelationShipQuery({
          parentId: parentNodeID,
          ID: result.ID
        })
      );
    }

    res.status(200).json({
      success: true,
      message: 'created_successfully'
    });
    return true;
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    let userList = [];

    let { records } = await cypherQuerySession.executeQuery(findUserQuery());

    const users = records[0]._fields[0];

    userList = users;

    res.status(200).send(userList);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    let { records } = await cypherQuerySession.executeQuery(
      findUserByIdQuery(userId)
    );

    const [user] = records[0]._fields[0];

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const isEmailExist = async (req, res, next) => {
  try {
    const email = req.body.email;

    let { records } = await cypherQuerySession.executeQuery(
      findUserByEmailQuery(email)
    );

    const user = records[0]._fields[0];

    res.status(200).json({
      success: true,
      isEmailExist: !!user[0].email
    });
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const isUserNameExist = async (req, res, next) => {
  try {
    const userName = req.body.userName;

    let { records } = await cypherQuerySession.executeQuery(
      findUserByUserNameQuery(userName)
    );

    const user = records[0]._fields[0];
    res.status(200).json({
      success: true,
      isUserNameExist: !!user[0].email
    });
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const recursiveUpdateAttributes = async (node, allPairingsFromDb) => {
  // If the node is empty, just return it as is.
  if (!node) {
    return node;
  }

  let children;
  children = await Promise.all(
    (node.has_invite || []).map(async childNode => {
      let childNodeProps = await recursiveUpdateAttributes(
        childNode,
        allPairingsFromDb
      );

      return {
        ...childNodeProps,

        _id: node._id.low,
        has_invite: [],
        'has_invite.date_created': '',
        matchingPairs: allPairingsFromDb.filter(
          u => u.source_user_id === childNode.ID
        )
      };
    })
  );

  return {
    INDEX_PLACEMENT: node.INDEX_PLACEMENT.low,
    name: node.name,

    _id: node._id.low,
    attributes: {
      ...node,
      INDEX_PLACEMENT: node.INDEX_PLACEMENT.low,
      _id: node._id.low,
      has_invite: [],
      'has_invite.date_created': ''
    },
    children: children.sort((a, b) => {
      let left = a.attributes?.INDEX_PLACEMENT;
      let right = b.attributes?.INDEX_PLACEMENT;

      if (left < right) {
        return -1;
      }
      if (left > right) {
        return 1;
      }
      return 0;
    }),
    has_invite: [],
    matchingPairs: allPairingsFromDb.filter(u => u.source_user_id === node.ID)
  };
};
export const getTreeStructure = async (req, res, next) => {
  try {
    // check if root has > 1 child
    let loggedInUser = req.user;

    const childUserInfo = await cypherQuerySession.executeQuery(
      getChildren({
        isSourceRootNode: true
      })
    );

    let [childUser] = childUserInfo.records[0]._fields[0];

    const data = await cypherQuerySession.executeQuery(
      getTreeStructureQuery({
        userId: loggedInUser.ID,
        withOptional: !childUser
      })
    );
    let result = data.records[0]._fields;

    console.log(result);

    let getAllMatchPairByIdQuery = await cypherQuerySession.executeQuery(
      getAllMatchPairById({ ID: false })
    );

    let matchingPairs = getAllMatchPairByIdQuery.records[0]._fields[0];

    let tree = await recursiveUpdateAttributes(result[0], matchingPairs);

    res.json({ success: true, data: tree });
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const createChildren = async (req, res, next) => {
  try {
    const data = req.body;

    const { firstName, lastName, email, position, parentNodeID, targetUserID } =
      data;

    let { records } = await cypherQuerySession.executeQuery(
      findUserByIdQuery(parentNodeID)
    );
    const [user] = records[0]._fields[0];
    let depthLevel = user?.DEPTH_LEVEL.low || 1;
    let sourceIndexPosition = user?.INDEX_PLACEMENT.low || 1;

    let nodeLogicProps = prepareDataBeforeInsertion({
      depthLevel: depthLevel,
      sourceIndexPosition: sourceIndexPosition,
      position: position
    });

    let childUserInfo = await cypherQuerySession.executeQuery(
      findUserByIdQuery(targetUserID)
    );

    let [childUser] = childUserInfo.records[0]._fields[0];

    let formData = {
      email: childUser.email,
      isRootNode: false,
      DEPTH_LEVEL: depthLevel + 1,
      ID_ALIAS: nodeLogicProps.newlyAddedUserAlias.nextAlias,
      INDEX_PLACEMENT: nodeLogicProps.newlyAddedUserAlias.nextPositionIndex,
      parentID: parentNodeID || ''
    };

    let createdUser = await cypherQuerySession.executeQuery(
      addUserQuery({
        ...formData
      })
    );

    if (position && parentNodeID && targetUserID) {
      const result = createdUser.records[0]._fields[0];

      await cypherQuerySession.executeQuery(
        createRelationShipQuery({
          parentId: parentNodeID,
          ID: result.ID
        })
      );

      const checkParentNodeIfPairExistQuery =
        await cypherQuerySession.executeQuery(
          getAllParentNodes({ ID: result.ID })
        );

      const [child, parents] =
        checkParentNodeIfPairExistQuery.records[0]._fields;

      // map all parents

      let allPossibleCombination = getAllPossibleMatch({
        depthLevel
      });

      console.log(result.ID_ALIAS);
      allPossibleCombination = allPossibleCombination
        .map(current => {
          const exists = current.includes(result.ID_ALIAS);

          if (exists && exists) {
            return current;
          } else {
            return false;
          }
        })
        .filter(u => u);

      let resultPairs = await Promise.all(
        parents.map(async ({ ID, DEPTH_LEVEL }) => {
          // check if theres match

          const pairing = await Promise.all(
            allPossibleCombination.map(async aliasSet => {
              const checkIfMatchExistQuery =
                await cypherQuerySession.executeQuery(
                  checkIfMatchExist({ ID, aliasSet })
                );

              let [{ low }] = checkIfMatchExistQuery.records[0]._fields;

              let pairMatched = low === 2;

              return {
                parentDepthLevel: DEPTH_LEVEL.low,
                currentDepthLevel: depthLevel,
                parentId: ID,
                aliasSet: aliasSet,
                pairMatched: pairMatched
              };
            })
          );

          let result = await Promise.all(
            pairing
              .filter(({ pairMatched }) => !!pairMatched)
              .map(async pairing => {
                return pairing;
              })
          );

          return {
            ID,
            DEPTH_LEVEL: DEPTH_LEVEL.low,
            result
          };
        })
      );

      let allParentPairings = resultPairs
        .filter(({ result }) => {
          return result && result.length > 0;
        })
        .sort(function (a, b) {
          let left = a.DEPTH_LEVEL;
          let right = b.DEPTH_LEVEL;

          if (left < right) {
            return 1;
          }
          if (left > right) {
            return -1;
          }
          return 0;
        });

      // let [chooseNearestParentThatHaveMatch] = allParentPairings;
      let consumedAlias = [];

      const allParentPairingsSimplified = allParentPairings
        .filter(({ ID }) => ID)
        .reduce((acc, current) => {
          const updated = current.result.map(pairing => {
            let currentAlias = pairing.aliasSet.join('=');

            if (consumedAlias.includes(currentAlias)) {
              return false;
            } else {
              consumedAlias.push(pairing.aliasSet.join('='));
              return pairing;
            }
          });

          current.result = updated.filter(u => u);

          return [...acc, current];
        }, []);

      await Promise.all(
        allParentPairingsSimplified.map((parent, index) => {
          parent.result.map(async pairing => {
            let currentAlias = pairing.aliasSet.join('=');

            let isAliasExistOnDbQuery = await cypherQuerySession.executeQuery(
              checkIfPairExist({
                name: currentAlias
              })
            );
            let [{ low }] = isAliasExistOnDbQuery.records[0]._fields;
            let isAliasExistOnDb = low > 0;
            console.log({ ID: parent.ID, currentAlias });

            if (!isAliasExistOnDb) {
              await cypherQuerySession.executeQuery(
                addPairingNode({
                  ID: uuidv4(),
                  parentId: parent.ID,
                  ...pairing
                })
              );
            }
          });
        })
      );
    }

    res.status(200).json({
      success: true,
      message: 'created_successfully'
    });
    return true;
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const getUserNodeWithChildren = async (req, res, next) => {
  try {
    const ID = req.body.ID;

    const childUserInfo = await cypherQuerySession.executeQuery(
      getChildren({
        ID: ID
      })
    );
    let childUsers = childUserInfo.records[0]._fields;

    let availablePosition = [
      { value: 'LEFT', label: 'Left' },
      { value: 'RIGHT', label: 'Right' }
    ];

    if (childUsers[0].length > 0) {
      let maxIndex = childUsers[0]
        .map(({ INDEX_PLACEMENT }) => {
          return INDEX_PLACEMENT?.low || 1;
        })
        .sort(function (a, b) {
          return a + b;
        });

      if (maxIndex[0] % 2 === 0) {
        availablePosition = [{ value: 'LEFT', label: 'Left' }];
      } else {
        availablePosition = [{ value: 'RIGHT', label: 'Right' }];
      }
    }

    res.json({ success: true, data: availablePosition });
  } catch (error) {
    res.status(400).send(error.message);
  }
};
