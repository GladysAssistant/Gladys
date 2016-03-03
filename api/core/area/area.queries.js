
module.exports = {
    // Haversine formula is used here to calculate distance in SQL
  // see here for explanations: http://vinsol.com/blog/2011/08/30/geoproximity-search-with-mysql/
  inArea: `
    SELECT area.*,
    ( 6371 * 2 * ASIN(SQRT(POWER(SIN(RADIANS(? - ABS(area.latitude))), 2) 
    + COS(RADIANS(?)) * COS(RADIANS(ABS(area.latitude))) 
    * POWER(SIN(RADIANS(? - area.longitude)), 2))) * 1000) AS distance
    FROM area
    WHERE area.user = ?
    HAVING distance < area.range
    ORDER BY distance;
  `  
};