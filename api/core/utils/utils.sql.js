var Promise = require('bluebird');
var sql = Promise.promisify(User.query);

module.exports = sql;
