var Promise = require('bluebird');

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

    return promise.then(function(machines) {
        if (machines.length === 0) {
            return Promise.reject(new Error('NotFound'));
        } else {
            return Promise.resolve(machines[0]);
        }
    });
};