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
  `,
  getLauncher: `
    SELECT launcher.title, launcher.condition_template, launcher.active, eventtype.code, launcher.user
    FROM launcher 
    JOIN eventtype ON launcher.eventtype = eventtype.id
    WHERE launcher.id = ?;
  `,
  getStates: `
    SELECT state.id, CONCAT(statetype.service, '.', statetype.function) as code, state.condition_template, state.active,
    stateparam.value, statetypeparam.variablename
    FROM state 
    JOIN statetype ON state.state = statetype.id
    JOIN stateparam ON stateparam.state = state.id
    JOIN statetypeparam ON statetypeparam.id = stateparam.statetypeparam
    WHERE launcher = ?;
  `,
  getActions: 
  ` 
    SELECT action.id, CONCAT(actiontype.service, '.', actiontype.function) as code, actionparam.value, actiontypeparam.variablename
    FROM action 
    JOIN actiontype ON action.action = actiontype.id
    JOIN actionparam ON actionparam.action = action.id
    JOIN actiontypeparam ON actiontypeparam.id = actionparam.actiontypeparam
    WHERE launcher = ?; 
  `
};
