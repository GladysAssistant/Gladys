var queries = require('./launcherParam.queries.js');

module.exports = function(options){
    return gladys.utils.sql(queries.getByEventType, [options.eventType]);
};