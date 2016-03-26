module.exports = {
    getByUser: `
        SELECT * FROM event
        JOIN eventtype ON (event.eventtype = eventtype.id)
        WHERE user = ? LIMIT ? OFFSET ?;`
};
