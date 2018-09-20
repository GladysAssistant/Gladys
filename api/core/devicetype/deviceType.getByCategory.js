var queries = require('./deviceType.queries.js');
/**
 * @public
 * @description This function return all deviceTypes of a category
 * @name gladys.deviceType.getByCategory
 * @param {Object} options
 * @param {String} options.category The category deviceType we want to get
 * @param {integer} options.room The room.id we want to get
 * @param {String} options.type The type of deviceType we want to get
 *  @returns {Array<deviceType>} deviceType
 * @example
 * 
 * gladys.deviceType.getByCategory(options)
 *      .then(function(deviceType){
 *          // do something
 *      })
 */

module.exports = function(options){
    return gladys.utils.sql(queries.getDeviceTypeByCategory, [options.category, options.room, options.room, options.type, options.type]);
};