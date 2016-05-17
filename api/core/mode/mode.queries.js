
module.exports = {
    get: 'SELECT * FROM mode;',
    delete: 'DELETE FROM mode WHERE id = ?;',
    getByCode: 'SELECT * FROM mode WHERE code = ?',
    getByHouse: `
        SELECT event.* FROM event 
        JOIN eventtype ON event.eventtype = eventtype.id
        WHERE house = ? AND eventtype.code = ? ORDER BY datetime DESC LIMIT 1;
    `
};