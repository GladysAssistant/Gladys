module.exports = {
    getByCode: `SELECT * FROM eventtype WHERE code = ?;`,
    getByUser: `
        SELECT * FROM event
        JOIN eventtype ON (event.eventtype = eventtype.id)
        WHERE user = ? LIMIT ? OFFSET ?;`
};
