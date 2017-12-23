module.exports = {
    getByUser: `
        SELECT * FROM event
        JOIN eventtype ON (event.eventtype = eventtype.id)
        WHERE user = ? ORDER BY datetime DESC LIMIT ? OFFSET ?;`,
    getByCode: 'SELECT * FROM eventtype WHERE code = ?;',
    getById: 'SELECT * FROM eventtype WHERE id = ?;',
    purge: `
        DELETE FROM event
        WHERE value = ?
        AND eventtype = ?
        AND datetime < NOW() - INTERVAL ? DAY;
    `
};
