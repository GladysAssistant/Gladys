var queries = require('./lifeevent.queries.js');

module.exports = function(type) {

    // testing if the event already exist
    return gladys.utils.sql(queries.getByName, [type.name])
        .then(function(types) {
            if (types.length) {

                // event already exist
                return Promise.resolve(type);
            } else {
                sails.log.info('Inserting new LifeEvent : ' + type.name);
                return EventType.create(type);
            }
        });
};
