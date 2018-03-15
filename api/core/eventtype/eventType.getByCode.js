var queries = require('./eventType.queries.js');

/**
 * @public
 * @description This function return an eventType
 * @name gladys.eventType.getByCode
 * @param {Object} type
 * @param {String} type.code The code of eventType to return
 * @returns {EventType} eventType
 * @example
 * var type = {
 *      code: "back-at-home"
 * }
 * gladys.eventType.getByCode(type)
 *      .then(function(eventType){
 *          // do something
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

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
