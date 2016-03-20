
module.exports = {
  getDeviceType: `
    SELECT dt.id, dt.type, dt.unit, dt.min, dt.max, dt.device, d.service 
    FROM device d
    JOIN devicetype dt ON (d.id = dt.device)
    WHERE dt.id = ?;
  `,
  getByDevice: `
    SELECT dt.*, ds.datetime as lastChanged, ds.value AS lastValue, ds.id AS lastValueId
    FROM devicetype dt
    LEFT JOIN devicestate ds ON (ds.devicetype = dt.id)
    WHERE dt.device = ?
    HAVING lastValueId = 
        (SELECT id FROM devicestate WHERE devicestate.devicetype = dt.id ORDER BY datetime DESC LIMIT 1)
        OR lastValueId IS NULL;
  `,
  getAll: `
    SELECT CONCAT(d.name, " - ", dt.type) AS name, d.service, d.protocol, dt.id, dt.type, dt.tag,  dt.unit, dt.min, dt.max, dt.device, r.name AS roomName, r.id as roomId 
    FROM device d
    JOIN devicetype dt ON (d.id = dt.device)
    JOIN room r ON (d.room = r.id);
  `
};