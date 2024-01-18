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

export const getFloaterData = ({ parentID, floaterPosition }) => {
  const queryText = `
  
  
    
  MATCH (u:User { 
      ID: '${parentID}'
  })

  MATCH (u)-[:has_floater]-> (floater:Floater { 
      floater_position: '${floaterPosition}'
  })


  MATCH (floater)-[:has_history]-> (c:ChildFloater)

  where c.status = false



  return  collect(properties(c)) as list

  `;

  return queryText;
};

export const updateFloaterData = ({ parentID, floaterPosition }) => {
  const queryText = `
  
  
    
  MATCH (u:User { 
      ID: '${parentID}'
  })

  MATCH (u)-[:has_floater]-> (floater:Floater { 
      floater_position: '${floaterPosition}'
  })


  MATCH (floater)-[:has_history]-> (c:ChildFloater)
  

  SET c.status = true



  return  *

  `;

  return queryText;
};

export const listFloaterData = ({ ID, floaterPosition }) => {
  const queryText = `
  
  
    
 MATCH (u:User {
      ID: '${ID}'
  })

  MATCH (u)-[:has_floater]-> (floater:Floater {
      floater_position: '${floaterPosition}'
  })





  MATCH (floater)-[:has_history]-> (c:ChildFloater)
  MATCH (target: User) where target.ID = c.childID

   with floater, c, {

    firstName: target.firstName,
    lastName: target.lastName

   } as childDetails



  ORDER BY c.date_created ASC


  return  collect({
    ID: c.ID,
  fromUser: childDetails,
  points: c.points,
  status: c.status,
  action_type: c.action_type,
 date_created: c.date_created

  })  as list


  `;

  return queryText;
};
