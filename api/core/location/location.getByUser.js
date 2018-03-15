const queries = require('./location.queries');

/**
 * @public
 * @description This function return all locations
 * @name gladys.location.getByUser
 * @param {Object} options
 * @param {integer} options.take The number of locations to return (optional)
 * @param {integer} options.skip The number of locations to skip (optional)
 * @param {integer} options.accuracy The accuracy of locations we want get (optional)
 * @param {integer} options.user The user id to which the locations are assigned
 * @returns {Array<locations>} location
 * @example
 * var options = {
 *      take: 50,
 *      skip: 0,
 *      accuracy: 300,
 *      user: 1
 * }
 * gladys.lacation.getByUser()
 *      .then(function(locations){
 *          // do something
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function getUser(options) {
    options = options || {};
    options.take = parseInt(options.take) || 50;
    options.skip = parseInt(options.skip) || 0;
    options.accuracy = options.accuracy  || 300;

    return gladys.utils.sql(queries.getLocationsUserPaginated, [options.user, options.accuracy, options.take, options.skip]);
};