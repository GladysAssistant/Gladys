var queries = require('./machine.queries.js');

/**
 * @public
 * @description This function delete an machine
 * @name gladys.machine.delete
 * @param {Object} machine
 * @param {integer} machine.id The id of the machine
 * @example
 * var machine = {
 *      id: 1
 * }
 * 
 * gladys.machine.delete(machine)
 *      .then(function(machine){
 *          // do something
 *      })
 */

module.exports = function(machine){
    return gladys.utils.sqlUnique(queries.delete, [machine.id]);    
};