var queries = require('./deviceType.queries.js');

/**
 * @public
 * @description This function is useful to find deviceType by tag
 * @name gladys.deviceType.getByTag
 * @param {Object} options
 * @param {String} options.tag string or array of tags
 * @returns {Array} Array of deviceTypes
 * @example
 * var options = {
 *    tag: ['light']
 * };
 * 
 * gladys.deviceType.getByTag(options)
 *      .then((deviceTypes) => {
 *         // deviceTypes is an array of deviceTypes
 *      })
 *      .catch((err) => {
 *          // something bad happened ! :/
 *      });
 */
module.exports = function(options){
  return gladys.utils.sql(queries.getDeviceTypeByTags, [options.tag]);
};