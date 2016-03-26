var queries = require('./eventType.queries.js');

module.exports = function(type) {

    // testing if the event already exist
    return gladys.utils.sql(queries.getByCode, [type.code])
        .then(function(types) {
            if (types.length) {

                // event already exist
                return Promise.resolve(type);
            } else {
                sails.log.info('Inserting new Event : ' + type.code);
                return EventType.create(type);
            }
        });
};
