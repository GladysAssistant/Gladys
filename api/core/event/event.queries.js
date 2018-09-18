module.exports = {
    getByUser: `
        SELECT eventtype.name, event.id, eventtype.iconColor, eventtype.faIcon,
        event.id, event.datetime, event.value, event.eventtype, area.name as areaName
        FROM event
        JOIN eventtype ON (event.eventtype = eventtype.id)
        LEFT JOIN area ON area.id = event.value AND eventtype.category = 'area'
        WHERE event.user = ? 
        ORDER BY datetime DESC 
        LIMIT ? OFFSET ?;`,
    getByCode: 'SELECT * FROM eventtype WHERE code = ?;',
    getByEventType: `SELECT * FROM event WHERE eventtype = ? ORDER BY datetime DESC LIMIT ? OFFSET ?;`,
    getById: 'SELECT * FROM eventtype WHERE id = ?;',
    purge: `
        DELETE FROM event
        WHERE datetime < NOW() - INTERVAL ? DAY;
    `
};