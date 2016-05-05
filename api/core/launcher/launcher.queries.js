
module.exports = {
  get: 'SELECT * FROM launcher WHERE user = ?;',
  getActions: `
      SELECT * FROM action 
      JOIN actiontype ON action.action = actiontype.id
      WHERE launcher = ?;`,
  getActionParams: `
    SELECT * FROM actionparam
    JOIN actiontypeparam ON actionparam.actiontypeparam = actiontypeparam.id
    WHERE action = ?;
  `  ,
  getStates: `
    SELECT * FROM state 
    JOIN statetype ON state.state = statetype.id
    WHERE launcher = ?;
  `
};