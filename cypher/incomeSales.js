import util from 'util';
export const addIncome = data => {
  let { type, userID, relatedEntityID, dateList } = data;

  let newData = {
    ...data,
    dateList: dateList ? JSON.stringify(dateList) : false
  };

  const queryText = `

     MERGE (n:IncomeSales {
        type: '${type}',
        userID: '${userID}',
        relatedEntityID: '${relatedEntityID}'

     })

     ON CREATE SET n += ${util.inspect(newData)}
     ON MATCH SET n.dateUpdated = ${Date.now()}


     RETURN *

 

  `;

  return queryText;
};

export const getIncome = relatedEntityID => {
  const queryText = `
  
 
  MATCH (p: IncomeSales)
  where  p.relatedEntityID = '${relatedEntityID}'

  return  properties(p) as data

  `;

  return queryText;
};
