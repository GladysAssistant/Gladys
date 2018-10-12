
module.exports = {
  getDeviceTypeByDeviceId: 
    `
        SELECT dt.id, dt.type, dt.unit, dt.min, dt.max, d.identifier, dt.device, d.service, d.machine, dt.identifier as deviceTypeIdentifier
        FROM devicetype dt 
        JOIN device d ON d.id = dt.device
        WHERE dt.category = 'television' 
        AND dt.device = ?;
    `,
  getTelevisionDeviceTypeByRoom:
        `
            SELECT dt.id, dt.type, dt.unit, dt.min, dt.max, d.identifier, dt.device, d.service, d.machine, dt.identifier as deviceTypeIdentifier
            FROM devicetype dt 
            JOIN device d ON d.id = dt.device
            WHERE d.room = ? AND dt.category = 'television';
        `,

  getDefaultDeviceType: 
    `
            SELECT dt.id, dt.type, dt.unit, dt.min, dt.max, d.identifier, dt.device, d.service, d.machine, dt.identifier as deviceTypeIdentifier
            FROM devicetype dt 
            JOIN device d ON d.id = dt.device
            WHERE dt.category = 'television'
            LIMIT 1;
    `
};
