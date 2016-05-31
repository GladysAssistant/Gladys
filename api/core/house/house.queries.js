

module.exports = {
  delete: 'DELETE FROM house WHERE id = ?;',
  get: `SELECT * FROM house LIMIT ? OFFSET ?;`,
  getAll: `SELECT * FROM house;`,
  getUsers: `
    SELECT user.*,
      ( 
        SELECT eventtype.code
        FROM event 
        JOIN eventtype ON event.eventtype = eventtype.id
        WHERE 
        ( eventtype.code = 'back-at-home' OR eventtype.code = 'left-home' )
        AND user = user.id 
        AND house = ?
        ORDER BY datetime DESC LIMIT 1 ) AS lastHouseEvent
      FROM user 
      HAVING lastHouseEvent = 'back-at-home'
  `
};