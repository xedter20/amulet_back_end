import util from 'util';

export const detectPositionFromParent = ({
  childNodeID,
  targetParentID,
  parentID
}) => {
  let queryText = ``;

  if (parentID === targetParentID) {
    queryText = `
   MATCH (n:User { ID: '${childNodeID}' }) <-[:has_invite]- (target:User { ID : '${targetParentID}'})    


    RETURN  { email: n.email, ID: n.ID, pos: n.INDEX_PLACEMENT } 

 

  `;
  } else {
    queryText = `
   MATCH (n:User { ID: '${childNodeID}' }) <-[:has_invite*]-

   (target:User)<-[:has_invite*1]- (parent:User { ID : '${targetParentID}'})    


    RETURN  { email: target.email, ID: target.ID, pos: target.INDEX_PLACEMENT } 

 

  `;
  }

  console.log(queryText);

  return queryText;
};

export const addUserQuery = params => {
  let { ID, ...otherParams } = {
    ...params
  };
  const queryText = `

     MERGE (n:User { email: '${params.email}' })

     ON CREATE  SET n += ${util.inspect(params)}
     ON MATCH SET n += ${util.inspect(otherParams)}

     RETURN properties(n) as user

 

  `;

  return queryText;
};
export const createRelationShipQuery = ({ parentId, ID }) => {
  const queryText = `



     MATCH (parent:User { ID:  '${parentId}' }) 
     MATCH (child:User { ID:  '${ID}' } ) 
     MERGE(parent)-[e:has_invite]->(child) 
     
     ON CREATE SET 
     e.date_created = ${Date.now()},
     child.parentID = '${parentId}'
     ON MATCH SET 
     e.date_updated = ${Date.now()},
     child.parentID = '${parentId}'


    

  `;

  return queryText;
};

export const findUserQuery = ({ sponsorIdNumber = false }) => {
  let queryText;
  if (sponsorIdNumber) {
    queryText = `
  MATCH (n:User ) 

  where n.sponsorIdNumber = '${sponsorIdNumber}'
  RETURN COLLECT(properties(n)) as data
  `;
  } else {
    queryText = `
  MATCH (n:User ) 
  RETURN COLLECT(properties(n)) as data
  `;
  }

  return queryText;
};

export const findUserByIdQuery = userId => {
  const queryText = `
  MATCH (n:User {
   ID : '${userId}'
  
  }) RETURN COLLECT(properties(n)) as data
  `;

  return queryText;
};

export const findUserByEmailQuery = email => {
  const queryText = `
  MATCH (n:User {
   email : '${email}'
  
  }) RETURN COLLECT(properties(n)) as data
  `;

  return queryText;
};

export const findUserByUserNameQuery = userName => {
  const queryText = `
  MATCH (n:User {
   userName : '${userName}'
  
  }) RETURN COLLECT(properties(n)) as data
  `;

  return queryText;
};

export const getTreeStructureQuery = ({ userId, withOptional }) => {
  const queryText = `


  ${
    userId
      ? `MATCH path =  ( p:User { ID:'${userId}' })`
      : `MATCH path =  ( p:User { isRootNode:true })`
  }

 

    ${
      withOptional
        ? ' OPTIONAL MATCH(p) -[:has_invite*]->(User) '
        : '-[:has_invite*]->(User)'
    }
   
    WITH collect(path) AS paths
    CALL apoc.convert.toTree(paths, true , {
      nodes: {User: ['name','firstName', 'lastName', 'ID','email' ,'INDEX_PLACEMENT','displayID']}
    })
    YIELD value
    RETURN value;
    
    
  `;

  return queryText;
};

export const getChildren = ({ ID, isSourceRootNode }) => {
  const queryText = `

     MATCH (parent:User { 
      
      ${isSourceRootNode ? 'isRootNode : true ' : `ID:'${ID}'`} 
    
    
    })-[e:has_invite]->(child) 
     RETURN  COLLECT(properties(child)) as children

    
  `;

  return queryText;
};
