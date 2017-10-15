
module.exports = {
    get: 'SELECT * FROM actiontype;',
    getParams: 'SELECT * FROM actiontypeparam WHERE actiontype = ?;',
    getParamByActionTypeAndVariable: 'SELECT * FROM actiontypeparam WHERE actiontype = ? AND variablename = ?;' ,
    getByUuid: 'SELECT * FROM actiontype WHERE uuid = ?;',
    getByServiceFunction: 'SELECT * FROM actiontype WHERE service = ? AND function = ?;'
};