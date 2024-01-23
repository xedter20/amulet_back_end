import util from 'util';

export const createCodeType = ({ codeType, data }) => {
  let { ID, ...otherProps } = data;
  let updateData = {
    ...otherProps
  };

  const queryText = `
  
 
  MERGE (ct: CodeType {
   name: '${codeType}'
  })
  
  on create  SET ct += ${util.inspect(data)}

  on match  SET ct += ${util.inspect(updateData)}

  return *

  `;

  return queryText;
};

export const listCodeType = () => {
  const queryText = `
  
 
  MATCH (ct: CodeType )
 
  return collect(properties(ct)) as data

  `;

  return queryText;
};

export const createCodeBundle = ({ bundleId, name }) => {
  let bundleData = {
    bundleId,
    dateTimeAdded: Date.now()
  };

  const queryText = `
  
 
  MERGE (cb:CodeBundle {
    bundleId: '${bundleId}'
  })

  with cb 
  MATCH (ct: CodeType {
   name: '${name}'
  })
  
  
  MERGE (ct)-[:has_bundle]->(cb)

  ON CREATE  SET cb += ${util.inspect(bundleData)}

  return *


  `;

  return queryText;
};

export const createNewCode = ({ name, bundleId, codeData }) => {
  let budleData = {
    bundleId,
    dateTimeAdded: Date.now()
  };

  const queryText = `

  
  MERGE (c:Code {
    name: '${codeData.code}'
  })

  with c
  MATCH (ct: CodeType {
   name: '${name}'
  })
  
  with c, ct
  MATCH (cb:CodeBundle {
    bundleId: '${bundleId}'
  })
  with c, ct, cb

  MERGE (cb)-[:has_code]->(c)
  ON CREATE  SET c += ${util.inspect(codeData)}



  return *

  `;

  return queryText;
};
