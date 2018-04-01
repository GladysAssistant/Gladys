
module.exports = {
  getDeviceType: `
    SELECT dt.id, dt.type, dt.unit, dt.min, dt.max, d.identifier, dt.device, d.service, d.protocol, dt.identifier as deviceTypeIdentifier, room.name as roomName
    FROM device d
    JOIN devicetype dt ON (d.id = dt.device)
    LEFT JOIN room ON d.room = room.id 
    WHERE dt.id = ?;
  `,
  getByRooms: `
    SELECT d.name, dt.id, dt.type, dt.category, dt.tag, dt.unit, dt.min, dt.max, dt.display, dt.sensor, d.identifier, dt.device, d.service,
    dt.lastValueDatetime as lastChanged, dt.lastValue AS lastValue, room.id as roomId, room.name as roomName, room.house as roomHouse
    FROM device d
    JOIN devicetype dt ON d.id = dt.device
    JOIN room ON d.room = room.id;
  `,
   getByRoom: `
   SELECT d.name, dt.id, dt.type, dt.category, dt.tag, dt.unit, dt.min, dt.max, dt.display, dt.sensor, d.identifier, dt.device, d.service,
   ds3.datetime as lastChanged, ds3.value AS lastValue, ds3.id AS lastValueId
   FROM device d
   JOIN devicetype dt ON (d.id = dt.device)
   LEFT JOIN (
      SELECT ds.devicetype, MAX(id) as id
      FROM devicestate ds 
      INNER JOIN (
        SELECT devicetype, MAX(datetime) as datetime FROM devicestate GROUP BY devicetype
      ) as dsJoin
      WHERE dsJoin.devicetype = ds.devicetype AND dsJoin.datetime = ds.datetime
      GROUP by ds.devicetype
  ) as deviceStateJoin ON (deviceStateJoin.devicetype = dt.id)
   LEFT JOIN devicestate ds3 ON deviceStateJoin.id = ds3.id
   WHERE d.room = ?;
  `,
  getByDevice: `
    SELECT dt.*, ds3.datetime as lastChanged, ds3.value AS lastValue, ds3.id AS lastValueId
    FROM device d
    JOIN devicetype dt ON (d.id = dt.device)
    LEFT JOIN (
      SELECT ds.devicetype, MAX(id) as id
      FROM devicestate ds 
      INNER JOIN (
        SELECT devicetype, MAX(datetime) as datetime FROM devicestate GROUP BY devicetype
      ) as dsJoin
      WHERE dsJoin.devicetype = ds.devicetype AND dsJoin.datetime = ds.datetime
      GROUP by ds.devicetype
  ) as deviceStateJoin ON (deviceStateJoin.devicetype = dt.id)
    LEFT JOIN devicestate ds3 ON deviceStateJoin.id = ds3.id
    WHERE dt.device = ?;
  `,
  getByIdentifier: `
    SELECT dt.*
    FROM devicetype dt
    JOIN device d ON (d.id = dt.device)
    WHERE d.identifier = ?
    AND d.service = ?
    AND dt.identifier = ?;
  `,
  getAll: `
    SELECT CONCAT(d.name, " - ", dt.type) AS name, d.service, d.protocol, dt.id, dt.type, dt.tag,  dt.unit, dt.min, dt.max, dt.device, r.name AS roomName, r.id as roomId 
    FROM device d
    JOIN devicetype dt ON (d.id = dt.device)
    JOIN room r ON (d.room = r.id);
  `,
  getByDeviceAndIdentifier: 'SELECT * FROM devicetype WHERE device = ? AND identifier = ?;',
  delete : 'DELETE FROM devicetype WHERE id = ?;',
  deleteDeviceStates: 'DELETE FROM devicestate WHERE devicetype = ?;',
  getById: `
    SELECT dt.*, ds3.datetime as lastChanged, ds3.value AS lastValue, ds3.id AS lastValueId, room.name as roomName
      FROM device d
      JOIN devicetype dt ON (d.id = dt.device)
      LEFT JOIN (
        SELECT ds.devicetype, MAX(id) as id
        FROM devicestate ds 
        INNER JOIN (
          SELECT devicetype, MAX(datetime) as datetime FROM devicestate GROUP BY devicetype
        ) as dsJoin
        WHERE dsJoin.devicetype = ds.devicetype AND dsJoin.datetime = ds.datetime
        GROUP by ds.devicetype
    ) as deviceStateJoin ON (deviceStateJoin.devicetype = dt.id)
      LEFT JOIN devicestate ds3 ON deviceStateJoin.id = ds3.id
      LEFT JOIN room ON d.room = room.id 
      WHERE dt.id = ?;
  `, 
  getByType: `
    SELECT dt.*, ds3.datetime as lastChanged, ds3.value AS lastValue, ds3.id AS lastValueId, room.name as roomName
      FROM device d
      JOIN devicetype dt ON (d.id = dt.device)
      LEFT JOIN (
        SELECT ds.devicetype, MAX(id) as id
        FROM devicestate ds 
        INNER JOIN (
          SELECT devicetype, MAX(datetime) as datetime FROM devicestate GROUP BY devicetype
        ) as dsJoin
        WHERE dsJoin.devicetype = ds.devicetype AND dsJoin.datetime = ds.datetime
        GROUP by ds.devicetype
    ) as deviceStateJoin ON (deviceStateJoin.devicetype = dt.id)
      LEFT JOIN devicestate ds3 ON deviceStateJoin.id = ds3.id
      LEFT JOIN room ON d.room = room.id 
      WHERE dt.type = ?;
  `, 

  getDeviceTypeByCategory:
  `
    SELECT devicetype.* FROM devicetype 
    JOIN device ON devicetype.device = device.id 
    WHERE category = ?
    AND (room = ? OR ? IS NULL)
    AND (type = ? OR ? IS NULL);
  `

  
};
