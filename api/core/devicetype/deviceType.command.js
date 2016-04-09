var Promise = require('bluebird');

module.exports = function command(options){
  console.log(options); 
  
  switch(options.label){
      case 'set-device-on':
        if(options.deviceTypes.length){
            return Promise.map(options.deviceTypes, function(deviceType){
                return gladys.deviceType.exec({devicetype: deviceType.id, value: 1});
            });
        } 
      break;
  }
  
   
};