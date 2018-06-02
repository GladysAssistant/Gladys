var Promise = require('bluebird');

/**
 * @public
 * @description This function update an machine
 * @name gladys.machine.update
 * @param {Object} machine
 * @param {integer} machine.id The id of machine
 * @param {String} machine.name The name of the machine
 * @param {House} machine.house The id of house of the machine
 * @param {String} machine.host The host of the machine
 * @param {boolean} machine.me If this machine is the updated machine
 * @returns {Machine} machine
 * @example
 * var machine = {
 *      id: 1,
 *      name: "Machine one updated",
 *      house: 1,
 *      host: "ip address",
 *      me: true,
 * }
 * 
 * gladys.machine.update(machine)
 *      .then(function(machine){
 *          // machine updated
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */
module.exports = function update(machine) {
    var promise;
    if (machine.uuid) {
        var uuid = machine.uuid;
        delete machine.uuid;
        promise = Machine.update({
            uuid
        }, machine);
    } else {
        var id = machine.id;
        delete machine.id;
        promise = Machine.update({
            id
        }, machine);
    }

    return promise.then((machines) => {
        if(machines.length === 0){
            return Promise.reject(new Error('NotFound'));
        } else {
            return Promise.resolve(machines[0]);
        }
    });
};