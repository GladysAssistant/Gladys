var sendCommand = require('./music.sendCommand.js');

/**
 * @public
 * @name gladys.music.stop
 * @description You can put the devicetype attribute OR the room attribute to determine in which room you want to control the music/which precise deviceType is playing.
 * @param {Object} params
 * @param {Integer} params.devicetype The id of the deviceType
 * @param {Integer} params.room The id of the room
 * @example
 * var params = {
 *      devicetype : 1 // or room
 * }
 * 
 * gladys.music.stop(params)
 */

module.exports = function stop(params) {
    return sendCommand('stop', params);
};