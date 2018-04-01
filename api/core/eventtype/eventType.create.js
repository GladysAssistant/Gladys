var queries = require('./eventType.queries.js');

/**
 * @public
 * @description This function create an eventType
 * @name gladys.eventType.create
 * @param {Object} type
 * @param {String} type.code The code of eventType, it must be unique
 * @param {String} type.name The name of eventType
 * @param {String} type.description The description of eventType
 * @param {String} type.category The category of eventType
 * @param {String} type.service The service of eventType
 * @param {String} type.faIcon The faIcon of eventType
 * @param {String} type.iconColor The iconColor of eventType
 * @returns {EventType>} eventType
 * @example
 * var type = {
 *      code: "back-at-home",
 *      name: "Back at Home",
 *      description: "User is back at home",
 *      category: "user", 
 *      service: "0",
 *      faIcon: "fa fa-home",
 *      iconColor: "bg-light-blue" 
 * }
 * gladys.eventType.create(type)
 *      .then(function(eventType){
 *          // do something
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function(type) {

    // testing if the event already exist
    return gladys.utils.sql(queries.getByCode, [type.code])
        .then(function(types) {
            if (types.length) {

                // event already exist
                return Promise.resolve(types[0]);
            } else {
                sails.log.info('Inserting new Event : ' + type.code);
                return EventType.create(type);
            }
        });
};
