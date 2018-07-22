module.exports = {
    getByUser: `
        SELECT * FROM event
        JOIN eventtype ON (event.eventtype = eventtype.id)
        WHERE user = ? ORDER BY datetime DESC LIMIT ? OFFSET ?;`,
    getByCode: 'SELECT * FROM eventtype WHERE code = ?;',
    getByEventType: `SELECT * FROM event WHERE eventtype = ? ORDER BY datetime DESC LIMIT ? OFFSET ?;`,
    getById: 'SELECT * FROM eventtype WHERE id = ?;',
    purge: `
        DELETE FROM event
        WHERE datetime < NOW() - INTERVAL ? DAY;
    `
};