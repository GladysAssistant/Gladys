var uuid = require('node-uuid');

module.exports = function create(machine){
   machine.uuid = machine.uuid || uuid.v4();
   return Machine.create(machine); 
};