import util from 'util';
export const createFloaterNode = (userId, data) => {
  let { floater_position, childID } = data;

  const queryText = `
  
  
    
  MATCH (u:User { 
      ID: '${userId}'
  })

  MERGE (u)-[:has_floater]-> (floater:Floater { 
      floater_position: '${floater_position}'
  })


  MERGE (floater)-[:has_history]-> (child_floater:ChildFloater
    {
    childID: '${childID}'

    }
    
    )


  ON CREATE  SET child_floater += ${util.inspect(data)}

  return *

  `;

  return queryText;
};
