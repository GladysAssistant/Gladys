
module.exports = {
  get: `SELECT *, DATE_FORMAT(datetime,'%d %b %Y %T') AS dateFormat
        FROM devicestate
        WHERE devicetype = ?
        ORDER BY datetime DESC
        LIMIT ?
        OFFSET ?;` ,
  getDeviceTypeByIdentifierAndType:  `
    SELECT devicetype.id
    FROM device 
    JOIN devicetype ON (device.id = devicetype.device)
    WHERE device.identifier = ? AND device.service = ? AND devicetype.type = ?;
  `,
  getDeviceTypeByIdentifierAndService:  `
    SELECT devicetype.id
    FROM device 
    JOIN devicetype ON (device.id = devicetype.device)
    WHERE devicetype.identifier = ? AND device.service = ?;
  `

};