const queries = require('./location.queries');

/**
 * @public
 * @description This function return all locations
 * @name gladys.location.get
 * @returns {Array<locations>} location
 * @example
 * gladys.lacation.get()
 *      .then(function(locations){
 *          // do something
 *      })
 */

module.exports = function get(){

    return gladys.utils.sql(queries.getLastLocationUser, []);
};