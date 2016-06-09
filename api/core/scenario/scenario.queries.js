module.exports = {
    getLaunchersWithCode: `
    SELECT launcher.* FROM launcher
    INNER JOIN eventtype ON launcher.eventtype = eventtype.id
    WHERE eventtype.code = ? AND active = 1;
  `,
    getActionsLauncher: `
  SELECT actiontype.service, actiontype.function, actiontype.name, action.id as actionId
  FROM action 
  INNER JOIN actiontype ON action.action = actiontype.id
  WHERE launcher = ?;
  `,
    getActionParams: `
      SELECT * FROM actionparam 
      JOIN actiontypeparam ON (actionparam.actiontypeparam = actiontypeparam.id)
      WHERE action = ?;`,
    getStatesLauncher: `
    SELECT statetype.*, state.id AS stateId, state.condition_template AS condition_template
    FROM state
    INNER JOIN statetype ON state.state = statetype.id
    WHERE launcher = ?; 
  `
};
