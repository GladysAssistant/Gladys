var queries = require('./eventType.queries.js');

module.exports = function(type) {

    // get the event
    return gladys.utils.sql(queries.getByCode, [type.code])
        .then(function(types) {
            if (types.length) {

                // return event
                return Promise.resolve(types[0]);
            } else {
               return Promise.reject(new Error('NotFound')); 
            }
        });
};
