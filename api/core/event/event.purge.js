var queries = require('./event.queries.js');

module.exports = function purge(options) {
    if(!options.hasOwnProperty('eventtype')) return Promise.reject(new Error('gladys.event.purge() : "eventtype" parameter is required.'));
    if(!options.hasOwnProperty('value')) return Promise.reject(new Error('gladys.event.purge() : "value" parameter is required.'));
    options.days = parseInt(options.days) || 10;
    return gladys.utils.sql(queries.purge, [options.value, options.eventtype, options.days]);
};