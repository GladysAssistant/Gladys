module.exports = {
    get: `
    SELECT device.*, room.name AS roomName 
    FROM device
    LEFT JOIN room ON device.room = room.id
    ORDER BY device.id
    LIMIT ?
    OFFSET ?;
  `,
  delete: 'DELETE FROM device WHERE id = ?;',
  deleteDeviceTypes: 'DELETE FROM devicetype WHERE device = ?;',
  getByIdentifier: 'SELECT * FROM device WHERE identifier = ? AND service = ?;',
  getByService: 'SELECT * FROM device WHERE service = ?;',
  getByServicePaginated: `
    SELECT device.*, room.name AS roomName 
    FROM device
    LEFT JOIN room ON device.room = room.id
    WHERE device.service = ?
    ORDER BY device.id
    LIMIT ?
    OFFSET ?;
  `,

};
