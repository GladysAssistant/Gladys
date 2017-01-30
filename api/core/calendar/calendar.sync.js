var queries = require('./calendar.queries.js');
const Promise = require('bluebird');

module.exports = function(options) {

    // get all services
    return gladys.utils.sql(queries.getAllCalendarService, [])
        .then((results) => {

            // foreach services, sync
            return Promise.map(results, function(result) {
                if(gladys.modules[result.service] && gladys.modules[result.service].calendar && typeof gladys.modules[result.service].calendar.sync === 'function') {

                    sails.log.info(`Calendar : syncing service ${result.service}`);
                    return gladys.modules[result.service].calendar.sync();
                }
            });
        }); 
};
