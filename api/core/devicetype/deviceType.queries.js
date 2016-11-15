
module.exports = {
  getDeviceType: `
    SELECT dt.id, dt.type, dt.unit, dt.min, dt.max, d.identifier, dt.device, d.service, dt.identifier as deviceTypeIdentifier
    FROM device d
    JOIN devicetype dt ON (d.id = dt.device)
    WHERE dt.id = ?;
  `,
   getByRoom: `
   SELECT d.name, dt.id, dt.type, dt.unit, dt.min, dt.max, dt.display, dt.sensor, d.identifier, dt.device, d.service,
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
    SELECT CONCAT(dt.name, " - ", r.name) AS name, d.service, d.protocol, dt.id, dt.type, dt.tag,  dt.unit, dt.min, dt.max, dt.device, r.name AS roomName, r.id as roomId 
    FROM device d
    JOIN devicetype dt ON (d.id = dt.device)
    JOIN room r ON (d.room = r.id);
  `,
  getById: `
    SELECT d.name, dt.id, dt.type, dt.unit, dt.min, dt.max, dt.display, dt.sensor, d.identifier, dt.device, d.service,
    ds.datetime as lastChanged, ds.value AS lastValue, ds.id AS lastValueId
    FROM device d
    JOIN devicetype dt ON (d.id = dt.device)
    LEFT JOIN devicestate ds ON dt.id = ds.devicetype
    WHERE dt.id = ?
    ORDER BY ds.id DESC
    LIMIT 1;
  `,
  getByDeviceAndIdentifier: 'SELECT id FROM devicetype WHERE device = ? AND identifier = ?;',
  delete : 'DELETE FROM devicetype WHERE id = ?;',
  deleteDeviceStates: 'DELETE FROM devicestate WHERE devicetype = ?;',
  getById: `
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
      WHERE dt.id = ?;
  `, 
  getByType: `
    SELECT dt.*, r.name as room, ds3.datetime as lastChanged, ds3.value AS lastValue, ds3.id AS lastValueId
      FROM device d
      JOIN devicetype dt ON (d.id = dt.device)
      JOIN room r ON (r.id = d.room) 
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
      WHERE dt.type = ?;
  `, 
  
};
