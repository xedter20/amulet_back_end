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
import ShortUniqueId from 'short-unique-id';
import {
  findUserByIdQuery,
  addUserQuery,
  createRelationShipQuery,
  getTreeStructureQuery,
  getChildren,
  findUserByEmailQuery,
  findUserByUserNameQuery,
  findUserQuery,
  detectPositionFromParent
} from '../cypher/user.js';
import {
  getAllParentNodes,
  checkIfMatchExist,
  addPairingNode,
  getAllMatchPairById,
  checkIfPairExist
} from '../cypher/transaction.js';

import {
  addNetworkNode,
  getNetworkNode,
  getNetworkNodeByID,
  updateNetworkNodeByID
} from '../cypher/networkReg.js';

import {
  createFloaterNode,
  getFloaterData,
  updateFloaterData,
  listFloaterData
} from '../cypher/floater.js';

import config from '../config.js';
import { packageRepo } from '../repository/package.js';
const { cypherQuerySession } = config;

const countTotalChildrenNodes = depthLevel => {
  return 1 * Math.pow(2, depthLevel);
};
const checkIfLeftOrRightOfParentNode = ({
  childNodeID,
  targetParentNodeID
}) => {};

checkIfLeftOrRightOfParentNode({
  firstParentDepthLevel: 4,
  targetParentDeptLevel: 3,
  // targetParentNodePosition: 2,
  currentNodeIndexPosition: 8
});
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

const userDisplayIdGenerator = () => {
  const { randomUUID } = new ShortUniqueId({ length: 5 });
  let currentYear = new Date().getFullYear();

  let displayId = `AM_OPC-${currentYear}-${randomUUID()}`;
  // check if exists in db

  return displayId;
};
export const createUser = async (req, res, next) => {
  try {
    const data = req.body;

    const { firstName, lastName, email, position, parentNodeID } = data;

    let formData = {
      ...data,
      ID: uuidv4(),
      name: `${firstName} ${lastName}`,
      date_created: Date.now(),
      displayID: userDisplayIdGenerator()
    };

    console.log(formData);

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

    let { records } = await cypherQuerySession.executeQuery(
      findUserQuery({
        sponsorIdNumber: false
      })
    );

    const users = records[0]._fields[0];

    userList = users;

    res.status(200).send(userList);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const getMySponseelist = async (req, res, next) => {
  try {
    let loggedInUser = req.user;

    let userList = [];
    const sponsorIdNumber = loggedInUser.ID || req.params.sponsorIdNumber;

    let { records } = await cypherQuerySession.executeQuery(
      findUserQuery({
        sponsorIdNumber
      })
    );

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

    let getAllMatchPairByIdQuery = await cypherQuerySession.executeQuery(
      getAllMatchPairById({ ID: false })
    );

    let matchingPairs = getAllMatchPairByIdQuery.records[0]._fields[0];

    let tree = await recursiveUpdateAttributes(result[0], matchingPairs);

    res.json({ success: true, data: tree });
  } catch (error) {
    console.log(error);
    res.status(400).send(error.message);
  }
};

export const createChildren = async (req, res, next) => {
  try {
    const data = req.body;

    const { position, parentNodeID, targetUserID } = data;

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

    await cypherQuerySession.executeQuery(
      createRelationShipQuery({
        parentId: parentNodeID,
        ID: targetUserID
      })
    );

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
      let { amulet_package, ID, INDEX_PLACEMENT, parentID } = childUser;

      let packageList = await packageRepo.listPackage();
      let foundAmuletPackage = packageList.find(p => {
        return p.name === amulet_package;
      });

      console.log({ foundAmuletPackage });

      if (foundAmuletPackage) {
        // create relationship parent -> child
        await cypherQuerySession.executeQuery(
          createRelationShipQuery({
            parentId: parentNodeID,
            ID: targetUserID
          })
        );

        let { points } = foundAmuletPackage;

        const checkParentNodeIfPairExistQuery =
          await cypherQuerySession.executeQuery(
            getAllParentNodes({ ID: targetUserID })
          );

        const [child, parents] =
          checkParentNodeIfPairExistQuery.records[0]._fields;

        let list_ParentsOfParents = await Promise.all(
          parents.map(async current => {
            let childNodeID = ID;
            let targetParentID = current.ID;

            let positionFromParent = position;

            let getPositionQuery = await cypherQuerySession.executeQuery(
              detectPositionFromParent({
                childNodeID,
                targetParentID,
                parentID: parentID
              })
            );
            let [details] = getPositionQuery.records[0]._fields;

            positionFromParent = details.pos.low === 1 ? 'LEFT' : 'RIGHT';

            return {
              ...current,

              position: positionFromParent,
              isViewed: false,
              date_viewed: ''
            };
          })
        );

        // insertion

        let data = {
          ID: uuidv4(),
          parentID: parentNodeID,
          childID: targetUserID,
          points,
          position,
          list_ParentsOfParents,
          list_ParentsOfParentsIDs: list_ParentsOfParents.map(({ ID }) => ID),
          date_created: Date.now()
        };

        await cypherQuerySession.executeQuery(addNetworkNode(data));

        console.log('inserted succesfully');
      }
    }

    res.status(200).json({
      success: true,
      message: 'created_successfully'
    });
    return true;
  } catch (error) {
    console.log(error);
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

export const getNetworkNodeList = async (req, res, next) => {
  try {
    let loggedInUser = req.user;

    let { records } = await cypherQuerySession.executeQuery(
      getNetworkNode({
        parentID: loggedInUser.ID
      })
    );
    const list = records[0]._fields[0];

    res.json({ success: true, data: list });
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const fetchCurrentPoints = async (
  mainPostion,
  floaterPosition,
  currentInsertedData,
  parentID
) => {
  let result = 0;

  let oldFloaterDataArray = [];
  let currentData = 0;

  let { records } = await cypherQuerySession.executeQuery(
    getFloaterData({
      parentID,
      floaterPosition
    })
  );
  oldFloaterDataArray = records[0]._fields[0];

  if (oldFloaterDataArray.length > 0) {
    currentData = oldFloaterDataArray[0].points.low;
  } else {
    currentData = 0;
  }

  let oldPoints = currentData; //Query on Floater data based on the logged in user

  if (mainPostion === 'LEFT') {
    if (floaterPosition === 'LEFT') {
      let newPoints = currentInsertedData.points;
      result = oldPoints + newPoints;
    } else {
      result = oldPoints;
    }
  } else {
    if (floaterPosition === 'RIGHT') {
      let newPoints = currentInsertedData.points;
      result = oldPoints + newPoints;
    } else {
      result = oldPoints;
    }
  }
  return result;
};

export const fetchFloaterData = async (req, res, next) => {
  try {
    let loggedInUser = req.user;

    let floaterPosition = req.body.floaterPosition;
    let { records } = await cypherQuerySession.executeQuery(
      listFloaterData({
        ID: loggedInUser.ID,
        floaterPosition
      })
    );
    const list = records[0]._fields[0];

    res.json({ success: true, data: list });
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const updateNetworkParentsofParents = async ({ ID, userId }) => {
  let { records } = await cypherQuerySession.executeQuery(
    getNetworkNodeByID({
      ID
    })
  );

  const networkV = records[0]._fields[0];

  let list_ParentsOfParents = JSON.parse(networkV.list_ParentsOfParents);

  let updatedData = list_ParentsOfParents.map(u => {
    let isViewed;
    if (u.isViewed) {
      isViewed = true;
    } else {
      if (u.ID === userId) {
        isViewed = true;
      }
    }
    return {
      ...u,
      isViewed: isViewed,
      date_viewed: Date.now()
    };
  });

  // console.log(ID);
  // console.log(updatedData);

  await cypherQuerySession.executeQuery(
    updateNetworkNodeByID({
      ID,
      data: {
        list_ParentsOfParents: JSON.stringify(updatedData)
      }
    })
  );

  return true;
};

const initialDataInsertion = async () => {};
const floaterDataInsertion = async ({
  floaterPosition,
  userID,
  insertData,
  currentPoints,
  actionType = 'INSERT'
}) => {
  await cypherQuerySession.executeQuery(
    updateFloaterData({
      parentID: userID,
      floaterPosition
    })
  );

  insertData = {
    ...insertData,
    points: currentPoints,
    floater_position: floaterPosition,
    status: false,
    action_type: actionType,
    date_created: Date.now()
  };
  await cypherQuerySession.executeQuery(createFloaterNode(userID, insertData));
};
export const createFloater = async (req, res, next) => {
  try {
    let ID = req.body.ID;
    let loggedInUser = req.user;
    let { records } = await cypherQuerySession.executeQuery(
      getNetworkNodeByID({
        ID
      })
    );

    const networkV = records[0]._fields[0];

    let parentID = networkV.parentID;

    let list_ParentsOfParents = JSON.parse(networkV.list_ParentsOfParents);

    let selectedNetWork = networkV;

    let isDirectParent = parentID === loggedInUser.ID;
    if (isDirectParent) {
      selectedNetWork.position = networkV.position;
    } else {
      selectedNetWork = list_ParentsOfParents.find(u => {
        return u.ID === loggedInUser.ID;
      });
    }

    selectedNetWork = {
      ...selectedNetWork,
      points: networkV.points.low,
      parentID: loggedInUser.ID
    };

    let insertData = {
      ID: uuidv4(),
      // floater_position: selectedNetWork.position,
      points: selectedNetWork.points,
      status: true,
      action_type: 'INSERT',
      date_created: Date.now(),
      earnings_inserted: 0,
      childID: networkV.childID
    };

    if (selectedNetWork.position === 'LEFT') {
      // left to right matching
      let currentLeftPoints = await fetchCurrentPoints(
        selectedNetWork.position,
        'LEFT',
        selectedNetWork,
        selectedNetWork.parentID
      ); // to query

      let currentRightPoints = await fetchCurrentPoints(
        selectedNetWork.position,
        'RIGHT',
        selectedNetWork,
        selectedNetWork.parentID
      );

      let result = 0;

      console.log({ currentLeftPoints, currentRightPoints });

      if (currentRightPoints > 0) {
        result = currentLeftPoints - currentRightPoints;
        if (result < 0) {
          let currentPoints = result * -1;
          //Insert the current points Right Floater
          //Insert Initial Data
          await floaterDataInsertion({
            floaterPosition: 'LEFT',
            userID: loggedInUser.ID,
            insertData,
            currentPoints: currentLeftPoints
          });

          await cypherQuerySession.executeQuery(
            updateNetworkNodeByID({
              ID,
              data: {
                type: 'OLD'
              }
            })
          );

          await updateNetworkParentsofParents({
            ID,
            userId: loggedInUser.ID
          });
          //End Insert Initial Data
          //Insert Data ==0 Left
          await floaterDataInsertion({
            floaterPosition: 'LEFT',
            userID: loggedInUser.ID,
            insertData,
            currentPoints: 0,
            actionType: 'DIFFERENCE'
          });
          //End  Insert Data ==0 Left
          await floaterDataInsertion({
            floaterPosition: 'RIGHT',
            userID: loggedInUser.ID,
            insertData,
            currentPoints,
            actionType: 'DIFFERENCE'
          });
        } else {
          //Insert the current points left Floater

          //Insert Initial Data
          await floaterDataInsertion({
            floaterPosition: 'LEFT',
            userID: loggedInUser.ID,
            insertData,
            currentPoints: currentLeftPoints
          });

          await cypherQuerySession.executeQuery(
            updateNetworkNodeByID({
              ID,
              data: {
                type: 'OLD'
              }
            })
          );

          await updateNetworkParentsofParents({
            ID,
            userId: loggedInUser.ID
          });
          //End Insert Initial Data

          let currentPoints = result;
          await floaterDataInsertion({
            floaterPosition: 'LEFT',
            userID: loggedInUser.ID,
            insertData,
            currentPoints,
            actionType: 'DIFFERENCE'
          });
          await floaterDataInsertion({
            floaterPosition: 'RIGHT',
            userID: loggedInUser.ID,
            insertData,
            currentPoints: 0,
            actionType: 'DIFFERENCE'
          });
        }
      } else {
        // insert new data to left floater
        // set the status of previos floater to false
        //Insert the current points left Floater

        await floaterDataInsertion({
          floaterPosition: 'LEFT',
          userID: loggedInUser.ID,
          insertData,
          currentPoints: currentLeftPoints
        });

        await cypherQuerySession.executeQuery(
          updateNetworkNodeByID({
            ID,
            data: {
              type: 'OLD'
            }
          })
        );

        await updateNetworkParentsofParents({
          ID,
          userId: loggedInUser.ID
        });
      }
    } else if (selectedNetWork.position === 'RIGHT') {
      // right to left
      let currentLeftPoints = await fetchCurrentPoints(
        selectedNetWork.position,
        'LEFT',
        selectedNetWork,
        selectedNetWork.parentID
      );
      let currentRightPoints = await fetchCurrentPoints(
        selectedNetWork.position,
        'RIGHT',
        selectedNetWork,
        selectedNetWork.parentID
      );

      console.log('RIGHHHTT');
      console.log({ currentLeftPoints, currentRightPoints });
      let result = 0;
      if (currentLeftPoints > 0) {
        result = currentRightPoints - currentLeftPoints;

        console.log({ result });
        if (result < 0) {
          let currentPoints = result * -1;
          // Insert Initial
          await floaterDataInsertion({
            floaterPosition: 'RIGHT',
            userID: loggedInUser.ID,
            insertData,
            currentPoints: currentRightPoints,
            actionType: 'INSERT'
          });

          await cypherQuerySession.executeQuery(
            updateNetworkNodeByID({
              ID,
              data: {
                type: 'OLD'
              }
            })
          );

          await updateNetworkParentsofParents({
            ID,
            userId: loggedInUser.ID
          });
          //End Insert Initial
          //Insert Difference == 0 RIGHT
          await floaterDataInsertion({
            floaterPosition: 'RIGHT',
            userID: loggedInUser.ID,
            insertData,
            currentPoints: 0,
            actionType: 'DIFFERENCE'
          });

          //End Insert Difference == 0 RIGHT
          console.log('executed 1');
          console.log(currentPoints);
          //Insert the current points left Floater
          await floaterDataInsertion({
            floaterPosition: 'LEFT',
            userID: loggedInUser.ID,
            insertData,
            currentPoints: currentPoints
          });
        } else {
          // Insert Initial
          await floaterDataInsertion({
            floaterPosition: 'RIGHT',
            userID: loggedInUser.ID,
            insertData,
            currentPoints: currentRightPoints,
            actionType: 'INSERT'
          });

          await cypherQuerySession.executeQuery(
            updateNetworkNodeByID({
              ID,
              data: {
                type: 'OLD'
              }
            })
          );

          await updateNetworkParentsofParents({
            ID,
            userId: loggedInUser.ID
          });
          //End Insert Initial

          //Insert right Floater
          console.log('executed 2');
          let currentPoints = result;
          await floaterDataInsertion({
            floaterPosition: 'RIGHT',
            userID: loggedInUser.ID,
            insertData,
            currentPoints,
            actionType: 'DIFFERENCE'
          });
          //Insert Difference == 0 left
          await floaterDataInsertion({
            floaterPosition: 'LEFT',
            userID: loggedInUser.ID,
            insertData,
            currentPoints: 0,
            actionType: 'DIFFERENCE'
          });
        }
      } else {
        await floaterDataInsertion({
          floaterPosition: 'RIGHT',
          userID: loggedInUser.ID,
          insertData,
          currentPoints: currentRightPoints
        });

        await cypherQuerySession.executeQuery(
          updateNetworkNodeByID({
            ID,
            data: {
              type: 'OLD'
            }
          })
        );

        await updateNetworkParentsofParents({
          ID,
          userId: loggedInUser.ID
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(400).send(error.message);
  }
};
