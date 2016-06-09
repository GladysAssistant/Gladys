var Promise = require('bluebird');

module.exports = function update(machine){
   var id = machine.id;
   delete machine.id; 
   return Machine.update({id}, machine)
    .then(function(machines){
        if(machines.length === 0){
            return Promise.reject(new Error('NotFound'));
        } else {
            return Promise.resolve(machines[0]);
        }
    });
};