var queries = require('./machine.queries.js');

/**
 * @public
 * @description This function return all machines
 * @name gladys.machine.get
 * @returns {Array<machines>} machine
 * @example
 * gladys.machine.get()
 *      .then(function(machines){
 *          // do something
 *      })
 */


module.exports = function get(){
    return gladys.utils.sql(queries.get, []);
};