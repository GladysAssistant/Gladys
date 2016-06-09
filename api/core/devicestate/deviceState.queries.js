
module.exports = {
  get: `SELECT *, DATE_FORMAT(datetime,'%d %b %Y %T') AS dateFormat
        FROM devicestate
        WHERE devicetype = ?
        ORDER BY datetime DESC
        LIMIT ?
        OFFSET ?;`  
};