
module.exports = {
    getByCode: `SELECT * FROM eventtype WHERE code = ?;`,
    getByCategory: 'SELECT * FROM eventtype WHERE category = ?;',
    get: 'SELECT * FROM eventtype;'
};