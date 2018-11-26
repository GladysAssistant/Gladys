var sendCommand = require('./television.sendCommand.js');

/**
 * @public
 * @name gladys.television.programVod
 * @description You can put the devicetype attribute OR the room attribute to determine in which room you want to control the television/which precise deviceType is playing.
 * @param {Object} params
 * @param {Integer} params.devicetype The id of the deviceType
 * @param {Integer} params.room The id of the room
 * @example
 * var params = {
 *      devicetype : 1 // or room
 * }
 * 
 * gladys.television.programVod(params)
 */

module.exports = function programVod(params) {
  return sendCommand('programVod', params);
};