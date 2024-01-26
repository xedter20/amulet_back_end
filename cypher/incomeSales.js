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
     ON MATCH SET n += ${util.inspect(newData)}


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

export const getIncomeByType = type => {
  const queryText = `
  
 
  MATCH (p: IncomeSales)
  where  p.type  = '${type}'

  return  collect(properties(p)) as data

  `;

  return queryText;
};

export const recievedDailyBonus = (ID, newData) => {
  let data = JSON.stringify(newData);
  const queryText = `
  
 
  MATCH (p: IncomeSales)
  where  p.ID  = '${ID}'
    SET p.dateList = ${util.inspect(data)}


  `;

  return queryText;
};
