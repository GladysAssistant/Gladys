
module.exports = {
    getDeviceTypeById: 
    `
        SELECT dt.id, dt.type, dt.unit, dt.min, dt.max, d.identifier, dt.device, d.service, d.machine, dt.identifier as deviceTypeIdentifier
        FROM devicetype dt 
        JOIN device d ON d.id = dt.device
        WHERE dt.id = ? AND dt.type = 'music';
    `,
    getMusicDeviceTypeByRoom:
        `
            SELECT dt.id, dt.type, dt.unit, dt.min, dt.max, d.identifier, dt.device, d.service, d.machine, dt.identifier as deviceTypeIdentifier
            FROM devicetype dt 
            JOIN device d ON d.id = dt.device
            WHERE d.room = ? AND dt.type = 'music';
        `,

    getDefaultDeviceType: 
    `
            SELECT dt.id, dt.type, dt.unit, dt.min, dt.max, d.identifier, dt.device, d.service, d.machine, dt.identifier as deviceTypeIdentifier
            FROM devicetype dt 
            JOIN device d ON d.id = dt.device
            WHERE dt.type = 'music'
            LIMIT 1;
    `
};