var Promise = require('bluebird');

module.exports = function command(options){
  console.log(options); 
  
  var value;
  
  switch(options.label){
      case 'set-device-on':
        value = 1;
      break;
      case 'set-device-off': 
        value = 0;
      break;
  }
  
   if(options.deviceTypes.length){
        return Promise.map(options.deviceTypes, function(deviceType){
            return gladys.deviceType.exec({devicetype: deviceType.id, value: value});
        });
   } 
   
};