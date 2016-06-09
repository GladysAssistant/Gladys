var queries = require('./script.queries.js');
var Promise = require('bluebird');

module.exports = function(options) {

    if (!options || !options.id) {
        return Promise.reject(new Error('Wrong parameters'));
    }

    return gladys.utils.sql(queries.getById, [options.id])
        .then(function(scripts) {
            if (scripts.length === 0) {
                return Promise.reject(new Error('Script not found'));
            }

            return Promise.resolve(scripts[0]);
        });
};
