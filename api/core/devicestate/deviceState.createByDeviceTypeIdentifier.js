var queries = require('./deviceState.queries.js');

/**
 * @public
 * @description This function create an deviceState
 * @name gladys.deviceState.createByDeviceTypeIdentifier
 * @param {String} identifier The identifer of device to which deviceType has been assigned
 * @param {String} service The service of device to which deviceType has been assigned
 * @param {float} state The value of state
 * @returns {State} state
 * @example
 * var identifier = 'milight-12';
 * var service = 'milight';
 * var state = {
 *  value: 1
 * };
 * 
 * gladys.deviceState.createByDeviceTypeIdentifier(identifier, service, state)
 *      .then(function(state){
 *         // deviceState created ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function(identifier, service, state){
    
    // we get the devicetype
    return gladys.utils.sqlUnique(queries.getDeviceTypeByIdentifierAndService, [identifier, service])
      .then(function(deviceType){
          
          // we create the deviceState
          state.devicetype = deviceType.id;
          return gladys.deviceState.create(state);
      });
};