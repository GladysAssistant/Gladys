
module.exports = {
    get: 'SELECT * FROM actiontype;',
    getParams: 'SELECT * FROM actiontypeparam WHERE actiontype = ?;'  
};