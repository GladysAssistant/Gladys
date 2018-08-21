var queries = require('./deviceType.queries.js');

/**
 * @public
 * @description This function return all deviceTypes
 * @name gladys.deviceType.getAll
 * @returns {Array<deviceType>} deviceType
 * @example
 * gladys.deviceType.getAll()
 *      .then(function(deviceTypes){
 *          // do something
 *      })
 */

module.exports = function(){
    return gladys.utils.sql(queries.getAll, []);
};