

module.exports = {
  get: `
    SELECT * FROM device
    JOIN devicetype ON (device.id = devicetype.device)
    LIMIT ?
    OFFSET ?;
  `,
  getDeviceType: `
    SELECT id, type, unit, min, max, device FROM devicetype
    WHERE id = ?;
  `
    
};