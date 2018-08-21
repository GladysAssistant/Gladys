const Promise = require('bluebird');
const queries = require('./music.queries.js');

module.exports = function sendCommand(functionName, params) {
    return getDeviceType(params)
      .then((deviceType) => {

          params.deviceType = deviceType;

          // if the device is not on this machine
          if(deviceType.machine && deviceType.machine.length){
             params.machine_id = params.machine;
             params.module_slug = deviceType.service;
             params.action = functionName;
             gladys.emit('music', params);
             return Promise.resolve();
          }

          if(!gladys.modules[deviceType.service] || !gladys.modules[deviceType.service].music)
                return Promise.reject(new Error(`Music : Module ${deviceType.service} does not exist or does not handle music.`));
         
          if(typeof gladys.modules[deviceType.service].music[functionName] != 'function')
               return Promise.reject(new Error(`Music : Module ${deviceType.service} does not have function ${functionName}`)); 
        
          // calling music module
          return gladys.modules[deviceType.service].music[functionName](params);
        });
};

function getDeviceType(params){
    if(params.devicetype) return gladys.utils.sqlUnique(queries.getDeviceTypeById, [params.devicetype]);
    else if(params.room) return gladys.utils.sqlUnique(queries.getMusicDeviceTypeByRoom, [params.room]);

    // if user does not specify a room, or a devicetype, we suppose there is only one 
    // and return this one
    else return gladys.utils.sqlUnique(queries.getDefaultDeviceType, []);
}