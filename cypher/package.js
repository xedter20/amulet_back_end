import util from 'util';

export const createPackage = ({ name, data }) => {
  const queryText = `
  
 
  MERGE (p: Package {
   name: '${name}'
  })
  
  on create  SET p += ${util.inspect(data)}



  return *

  `;

  return queryText;
};

export const getPackage = () => {
  const queryText = `
  
 
  MATCH (p: Package)
  
  return  collect(properties(p)) as data

  `;

  return queryText;
};
