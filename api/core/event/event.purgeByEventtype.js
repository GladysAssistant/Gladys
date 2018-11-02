var queries = require('./event.queries.js');

/**
 * @public
 * @description This function purge all events on a specific eventtype code and older than days 
 * @name gladys.event.purgeByEventType
 * @param {Object} options
 * @param {integer} options.eventtype The code of eventtype we want to purge
 * @param {integer} options.days The days we want to keep for this kind of event (optionnal)
 * @returns {event} event
 * @example
 * var options = {
 *      days: 2,
 *      eventtype: 'devicetype-new-value'
 * }
 * gladys.event.purgeByEventType(options)
 *      .then(function(events){
 *          // do something
 *      })
 */


module.exports = function purge(options) {

    options.days = parseInt(options.days) || 10;
    return gladys.utils.sql(queries.purgeByEventType, [options.days, options.eventtype]);
};

