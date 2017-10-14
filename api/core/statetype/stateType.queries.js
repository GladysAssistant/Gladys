
module.exports = {
    get: 'SELECT * FROM statetype;',
    getByUuid: 'SELECT * FROM statetype WHERE uuid = ?;',
    getByServiceFunction: 'SELECT * FROM statetype WHERE service = ? AND function = ?;'
};