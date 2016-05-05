
module.exports = {
  get: `
   SELECT launcher.id, launcher.condition_template, launcher.createdAt, launcher.updatedAt, launcher.user, launcher.active,
   eventtype.name, eventtype.faIcon, eventtype.iconColor, eventtype.category
   FROM launcher 
   JOIN eventtype ON launcher.eventtype = eventtype.id 
   WHERE user = ?;
   `,
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
  `,
  delete: 'DELETE FROM launcher WHERE id = ?;',
};