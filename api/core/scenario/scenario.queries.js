module.exports = {
    getLaunchersWithCode: `
    SELECT launcher.* FROM launcher
    INNER JOIN launchertype ON launcher.launcher = launchertype.id
    WHERE launchertype.code = ? AND active = 1;
  `,
    getActionsLauncher: `
  SELECT actiontype.*, action.id AS actionId
  FROM action 
  INNER JOIN actiontype ON action.action = actiontype.id
  WHERE launcher = ?;
  `,
    getActionParams: `SELECT * FROM actionparam WHERE action = ?;`,
    getStatesLauncher: `
    SELECT statetype.*, state.id AS stateId, state.condition_template AS condition_template
    FROM state
    INNER JOIN statetype ON state.state = statetype.id
    WHERE launcher = ?; 
  `
};
