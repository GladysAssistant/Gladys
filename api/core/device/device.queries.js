module.exports = {
    get: `
    SELECT device.*, room.name AS roomName 
    FROM device
    JOIN room ON device.room = room.id
    LIMIT ?
    OFFSET ?;
  `,
  delete: 'DELETE FROM device WHERE id = ?;',
  deleteDeviceTypes: 'DELETE FROM devicetype WHERE device = ?;'

};
