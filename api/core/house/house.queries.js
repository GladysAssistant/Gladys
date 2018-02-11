

module.exports = {
  delete: 'DELETE FROM house WHERE id = ?;',
  get: `SELECT * FROM house LIMIT ? OFFSET ?;`,
  getById: 'SELECT * FROM house WHERE id = ?;',
  getAll: `SELECT * FROM house;`,
  getLastEventHouseUser: `
    SELECT event.*, eventtype.code
    FROM event
    JOIN eventtype ON event.eventtype = eventtype.id
    WHERE ( 
      eventtype.code = 'back-at-home' 
      OR eventtype.code = 'left-home' 
      OR eventtype.code = 'user-seen-at-home' 
    )
    AND event.user = ? AND event.house = ?
    ORDER BY event.datetime DESC
    LIMIT 1;
  `, 
  getUsers: `
    SELECT user.*,
      ( 
        SELECT eventtype.code
        FROM event 
        JOIN eventtype ON event.eventtype = eventtype.id
        WHERE 
        ( eventtype.code = 'back-at-home' OR eventtype.code = 'left-home' OR eventtype.code = 'user-seen-at-home' )
        AND user = user.id
        AND house = ?
        ORDER BY datetime DESC LIMIT 1 ) AS lastHouseEvent
      FROM user 
      HAVING ( lastHouseEvent = 'back-at-home' OR lastHouseEvent = 'user-seen-at-home' )
  `,
  isUserAtHome: `
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
      WHERE user.id = ?
      HAVING ( lastHouseEvent = 'back-at-home' OR lastHouseEvent = 'user-seen-at-home' )
  `,
  getUserAtHomeAndNotSeenSince: 
  `
    SELECT user.id, MAX(event.datetime) as datetime  
    FROM user
    JOIN event ON event.user = user.id
    JOIN eventtype ON event.eventtype = eventtype.id
    WHERE ( eventtype.code = 'back-at-home' OR eventtype.code = 'user-seen-at-home' )
    AND house = ?
    AND user.id IN (
        SELECT user.id
        FROM user 
        WHERE ( 
            SELECT eventtype.code
            FROM event 
            JOIN eventtype ON event.eventtype = eventtype.id
            WHERE 
            ( eventtype.code = 'back-at-home' OR eventtype.code = 'left-home' )
            AND user = user.id
            AND house = ?
            ORDER BY datetime DESC LIMIT 1 ) = 'back-at-home'
    )
    GROUP BY user.id
    HAVING datetime < DATE_SUB(NOW(), INTERVAL ? MINUTE)
  `,
  isUserAsleep: `
    SELECT user.*,
      ( 
        SELECT eventtype.code
        FROM event 
        JOIN eventtype ON event.eventtype = eventtype.id
        WHERE 
        ( eventtype.code = 'going-to-sleep' OR eventtype.code = 'wake-up' )
        AND user = user.id 
        AND house = ?
        ORDER BY datetime DESC LIMIT 1 ) AS lastHouseEvent
      FROM user 
      WHERE user.id = ?
      HAVING lastHouseEvent = 'going-to-sleep'
  `
};