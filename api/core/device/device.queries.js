

module.exports = {
  get: `
    SELECT * FROM device
    JOIN devicetype ON (device.id = devicetype.device)
    LIMIT ?
    OFFSET ?;
  `,
  getDeviceType: `
    SELECT dt.id, dt.type, dt.unit, dt.min, dt.max, dt.device, d.service 
    FROM device d
    JOIN devicetype dt ON (d.id = dt.device)
    WHERE dt.id = ?;
  `
    
};