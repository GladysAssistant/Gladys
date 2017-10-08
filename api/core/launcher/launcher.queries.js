
module.exports = {
  get: `
   SELECT launcher.id, launcher.title, launcher.condition_template, launcher.createdAt, launcher.updatedAt, launcher.user, launcher.active,
   eventtype.name, eventtype.faIcon, eventtype.iconColor, eventtype.category
   FROM launcher 
   JOIN eventtype ON launcher.eventtype = eventtype.id 
   WHERE user = ?;
   `,
  getActions: `
      SELECT action.*, actiontype.uuid, actiontype.service, actiontype.function, actiontype.name, actiontype.optionspath  FROM action 
      JOIN actiontype ON action.action = actiontype.id
      WHERE launcher = ?;`,
  getActionParams: `
    SELECT * FROM actionparam
    JOIN actiontypeparam ON actionparam.actiontypeparam = actiontypeparam.id
    WHERE action = ?;
  `  ,
  getStates: `
    SELECT state.*, statetype.uuid, statetype.service, statetype.function, statetype.name FROM state 
    JOIN statetype ON state.state = statetype.id
    WHERE launcher = ?;
  `,
  delete: 'DELETE FROM launcher WHERE id = ?;',
};