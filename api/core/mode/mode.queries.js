
module.exports = {
    get: 'SELECT * FROM mode;',
    delete: 'DELETE FROM mode WHERE id = ?;',
    getByCode: 'SELECT * FROM mode WHERE code = ?',
    getByHouse: `
        SELECT event.*, mode.id as modeId FROM event
        JOIN eventtype ON event.eventtype = eventtype.id
        JOIN mode ON mode.code = event.value
        WHERE house = ? AND eventtype.code = ? ORDER BY datetime DESC LIMIT 1;
    `
};
