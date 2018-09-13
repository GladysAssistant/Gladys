
module.exports = {
    getDeviceTypeByDeviceIdOrByDeviceTypeId: 
    `
        SELECT dt.id, dt.type, dt.unit, dt.min, dt.max, d.identifier, dt.device, d.service, dt.identifier as deviceTypeIdentifier
        FROM devicetype dt 
        JOIN device d ON d.id = dt.device
        WHERE dt.category = 'tv' 
        AND (dt.device = ? OR ? = null) 
        OR (dt.id = ? OR ? = null);
    `,
    getTelevisionDeviceTypeByRoom:
        `
            SELECT dt.id, dt.type, dt.unit, dt.min, dt.max, d.identifier, dt.device, d.service, dt.identifier as deviceTypeIdentifier
            FROM devicetype dt 
            JOIN device d ON d.id = dt.device
            WHERE d.room = ? AND dt.category = 'tv';
        `,

    getDefaultDeviceType: 
    `
            SELECT dt.id, dt.type, dt.unit, dt.min, dt.max, d.identifier, dt.device, d.service, dt.identifier as deviceTypeIdentifier
            FROM devicetype dt 
            JOIN device d ON d.id = dt.device
            WHERE dt.category = 'tv'
            LIMIT 1;
    `
};