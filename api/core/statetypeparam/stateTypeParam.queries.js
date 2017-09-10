
module.exports = {
  getByStateType: 'SELECT * FROM statetypeparam WHERE statetype = ?;',
  getByStateTypeAndVariableName: 'SELECT * FROM statetypeparam WHERE statetype = ? AND variablename = ?;',
  cleanDuplicateStateTypeParams: `
    DELETE FROM statetypeparam
      WHERE id NOT IN 
      (
        SELECT MIN(id) as rowId
        FROM (SELECT * FROM statetypeparam) AS stp
        GROUP BY variablename, statetype
      );
  `
};