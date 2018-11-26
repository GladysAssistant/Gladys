
module.exports = {
  get: `
    SELECT *
    FROM devicestate
    ORDER BY datetime DESC
    LIMIT ?
    OFFSET ?;
  `,
  getByDeviceType: `SELECT *, DATE_FORMAT(datetime,'%d %b %Y %T') AS dateFormat
        FROM devicestate
        WHERE devicetype = ?
        ORDER BY datetime DESC
        LIMIT ?
        OFFSET ?;`,
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
  `,
  purge: `
    DELETE FROM devicestate
    WHERE devicetype = ?
    AND datetime < NOW() - INTERVAL ? DAY;
  `,
  updateDeviceTypeLastValue: `
    UPDATE devicetype SET lastValue = ?, lastValueDatetime = ? WHERE id = ? AND ( lastValueDatetime <= ? OR lastValueDatetime IS NULL);
  `,
  getAllDeviceType: `
    SELECT * FROM devicetype;
  `,
  getLastDeviceState: `
    SELECT * FROM devicestate WHERE devicetype = ? ORDER BY datetime DESC LIMIT 1;
  `,
  getByDeviceTypeFiltered: `
    SELECT datetime, value
    FROM devicestate 
    WHERE devicetype = ?
    AND createdAt BETWEEN ? AND ?
    ORDER BY datetime DESC;
  `,
  getFiltered: `
    SELECT *, DATE_FORMAT(datetime,'%d %b %Y %T') AS dateFormat
    FROM devicestate 
    AND createdAt >= ?
    AND createdAt <= ?
    ORDER BY datetime DESC;
  `,
  getFilteredMinMax: `
    SELECT min(value) AS min, max(value) AS max, date(datetime) AS datetime
    FROM devicestate 
    WHERE (devicetype=? AND datetime BETWEEN ? AND ?) 
    group by date(datetime) ;
  `
};
