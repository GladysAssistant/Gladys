var sendCommand = require('./music.sendCommand.js');

module.exports = function getVolume(params) {
  return sendCommand('getVolume', params);
};