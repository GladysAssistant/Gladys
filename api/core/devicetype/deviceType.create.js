const Promise = require('bluebird');
const queries = require('./deviceType.queries.js');

/**
 * @public
 * @description This function create an deviceType
 * @name gladys.deviceType.create
 * @param {Object} type
 * @param {String} type.name The name of the deviceType
 * @param {String} type.type The type of the deviceType (binary or multilevel)
 * @param {bolean} type.sensor If the deviceType is an sensor
 * @param {integer} type.min The min of the deviceType
 * @param {integer} type.max The max of the deviceType
 * @param {String} type.unit The unit of the deviceType
 * @param {Device} type.device The id of device to which it is assigned
 * @returns {DeviceType} deviceType
 * @example
 * var type = {
 *      name: "My deviceType",
 *      type: 'multilevel',
 *      sensor: true,
 *      min: 0,
 *      max: 50,
 *      unit: "%",
 *      device: 1
 * };
 * 
 * gladys.deviceType.create(type)
 *      .then(function(devicType){
 *         // deviceType created ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function create(type){
    return deviceTypeExist(type)
      .then((exist) => {

          if(exist) {

              // If the deviceType already exists, we update it but not its name, display and tag param
              type.name = exist.name;
              type.display = exist.display;
              type.tag = exist.tag;

              return DeviceType.update({id: exist.id}, type)
                               .then((rows) => {
                                   if(rows.length) return rows[0];
                                   else return null;
                               });
          } else {
              return DeviceType.create(type);
          }
      });
};

/**
 * Returns true if the deviceType exist
 */
function deviceTypeExist(type){
    if(type.device && type.identifier){
        return gladys.utils.sql(queries.getByDeviceAndIdentifier, [type.device, type.identifier])
                .then((rows) => {
                    if(rows.length) return rows[0];
                    else return false;
                });
    } else {
        return Promise.resolve(false);
    }
}
