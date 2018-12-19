
module.exports = {
  // Haversine formula is used here to calculate distance in SQL
  // see here for explanations: http://vinsol.com/blog/2011/08/30/geoproximity-search-with-mysql/
  getDistance: `
    SELECT area.*,
    ( 6371 * 2 * ASIN(
        SQRT(   POWER(SIN(RADIANS(? - area.latitude) / 2), 2) + COS(RADIANS(?)) * COS(RADIANS(area.latitude)) 
    * POWER(SIN(RADIANS(? - area.longitude) / 2), 2))) * 1000) AS distance
    FROM area
    WHERE area.user = ?
    ORDER BY distance;
  `,
  lastLocationUser: `
    SELECT * FROM location
    WHERE user = ?
    ORDER BY datetime DESC
    LIMIT 1;
  `,
  delete: 'DELETE FROM area WHERE id = ?;',
  get: 'SELECT * FROM area WHERE user = ?;',
  getAll: 'SELECT * FROM area;',
  getLastAreaEventPerArea: `
    SELECT MAX(DATETIME) as datetime, value, eventtype.code as code
    FROM event 
    JOIN eventtype ON eventtype.id = event.eventtype
    WHERE ( eventtype.code = 'enter-area' OR eventtype.code = 'left-area')
    AND event.user = ?
    GROUP BY value, eventtype.code
    ORDER BY datetime DESC;
  `
};
