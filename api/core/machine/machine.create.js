var uuid = require('uuid');

/**
 * @public
 * @description This function create an machine
 * @name gladys.machine.create
 * @param {Object} machine
 * @param {String} machine.name The name of the machine
 * @param {House} machine.house The id of house of the machine
 * @param {String} machine.host The host of the machine
 * @param {boolean} machine.me If this machine is the created machine
 * @returns {Machine} machine
 * @example
 * var machine = {
 *      name: "Machine one",
 *      house: 1,
 *      host: "ip address",
 *      me: true,
 * }
 * 
 * gladys.machine.create(machine)
 *      .then(function(machine){
 *          // machine created
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function create(machine){
   machine.uuid = machine.uuid || uuid.v4();
   return Machine.create(machine); 
};