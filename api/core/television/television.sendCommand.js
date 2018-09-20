const Promise = require('bluebird');
const queries = require('./television.queries.js');

module.exports = function sendCommand(functionName, params) {
    return getDeviceType(params)
      .then((deviceType) => {

          if(!gladys.modules[deviceType.service] || !gladys.modules[deviceType.service].television)
                return Promise.reject(new Error(`television : Module ${deviceType.service} does not exist or does not handle television.`));
         
          if(typeof gladys.modules[deviceType.service].television[functionName] != 'function') {
            sails.log.error(`television : Module ${deviceType.service} does not have function ${functionName}`)
            return Promise.reject();
          } 

          params.deviceType = deviceType;
        
          // calling television module
          return gladys.modules[deviceType.service].television[functionName](params);
        });
};

function getDeviceType(params){
    if(params.device.id) return gladys.utils.sqlUnique(queries.getDeviceTypeByDeviceId, [params.device.id]);
    else if(params.room) return gladys.utils.sqlUnique(queries.getTelevisionDeviceTypeByRoom, [params.room]);
    // if user does not specify a room, or a device, we suppose there is only one 
    // and return this one
    else return gladys.utils.sqlUnique(queries.getDefaultDeviceType, []);
}