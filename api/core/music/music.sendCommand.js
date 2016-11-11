const Promise = require('bluebird');
const queries = require('./music.queries.js');

module.exports = function sendCommand(functionName, params) {
    return getDeviceType(params)
      .then((deviceType) => {

          if(!gladys.modules[deviceType.service] || !gladys.modules[deviceType.service].music)
                return Promise.reject(new Error(`Music : Module ${deviceType.service} does not exist or does not handle music.`));
         
          if(typeof gladys.modules[deviceType.service].music[functionName] != 'function')
               return Promise.reject(new Error(`Music : Module ${deviceType.service} does not have function ${functionName}`)); 

          params.deviceType = deviceType;
        
          // calling music module
          return gladys.modules[deviceType.service].music[functionName](params);
        });
};

function getDeviceType(params){
    if(params.devicetype) return gladys.utils.sqlUnique(queries.getDeviceTypeById, [params.devicetype]);
    else if(params.room) return gladys.utils.sqlUnique(queries.getMusicDeviceTypeByRoom, [params.room]);
    else return Promise.reject(new Error(`You should specify a room or a devicetype.`));
}