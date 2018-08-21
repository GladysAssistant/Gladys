
/**
 * @public
 * @description This function set the lastSeen attribute of the machine to now
 * @name gladys.machine.heartbeat
 * @param {machine} machine The machine
 * @param {uuid} machine.uuid The uuid of the machine
 * @returns {Machine} machine
 * @example
 * 
 * var machine = {
 *  uuid: '46929309-0fa0-4f29-8c51-4d8e6ff6b078'
 * };
 * 
 * gladys.machine.heartbeat(machine)
 *      .then((machine) => {
 *          
 *      })
 *      .catch((err) => {
 *          // something bad happened ! :/
 *      });
 */

module.exports = function(machine) {
    machine.lastSeen = new Date();
    return gladys.machine.update(machine);
};