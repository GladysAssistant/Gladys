

module.exports = {
  get: `
    SELECT * FROM Device
    JOIN DeviceType ON (Device.id = DeviceType.device)
    LIMIT ?
    OFFSET ?;
  `,
  getDeviceType: `
    SELECT id, type, unit, min, max, device FROM DeviceType
    WHERE id = ?;
  `
    
};