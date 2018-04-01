module.exports = create;

var queries = require('./device.queries.js');
var Promise = require('bluebird');

/**
 * @public
 * @description This function create an device and its deviceType (see exemple for more details)
 * @name gladys.device.create
 * @param {Object} param
 * @param {Object} param.device
 * @param {Array} param.types if the device has deviceType (optional)
 * @param {Object} device
 * @param {String} device.name The name of the device
 * @param {String} device.identifer The identifer of the device, it must be unique
 * @param {String} device.protocol The protocol of the device
 * @param {String} device.service The service of the device, the module to which it must be connected
 * @param {Array} types
 * @param {String} types.type The type of the deviceType (binary or multilevel)
 * @param {bolean} types.sensor If the type is an sensor
 * @param {integer} types.min The min of the deviceType
 * @param {integer} types.max The max of the deviceType
 * @returns {Device} device
 * @example
 * var param = {
 *     device: {
 *         name: 'Light in my room',
 *         identifier: 'milight-12',
 *         protocol: 'milight',
 *         service: 'milight'
 *     },
 *     types: [
 *         {
 *             type: 'binary',
 *             sensor: false,
 *             min: 0,
 *             max: 1
 *         },
 *         {
 *             type:'multilevel',
 *             unit: 'color',
 *             sensor: false,
 *             min: 0,
 *             max: 100
 *         }
 *     ]   
 * };
 * 
 * gladys.device.create(param)
 *      .then(function(device){
 *         // device created ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

function create(param) {

    var deviceUpdated = false;

    // we test first if the device and it's identifier already exist or not
    return gladys.utils.sql(queries.getByIdentifier, [param.device.identifier, param.device.service])
      .then(function(devices){
         
          if(devices.length){

              deviceUpdated = true;
              
               // if device already exist, we update it and no change name
              param.device.name = devices[0].name;
              return Device.update({id: devices[0].id}, param.device)
                           .then((rows) => rows[0]);
          } else {

              // if not, we create the device
              return Device.create(param.device);
          }
      })
      .then((device) => {

          // foreach deviceType, we create it if not exist
          return Promise.map(param.types, function(type){
               type.device = device.id;
               return gladys.deviceType.create(type);
          })
          .then((types) => {

              // we return device and types
              return {device: device, types: types};
          });

      })
      .then((result) => {

        if(!deviceUpdated) {
            // broadcast news to everyone
            gladys.socket.emit('newDevice', result);
        }

         return result;
      });
}
