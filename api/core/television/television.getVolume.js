var sendCommand = require('./television.sendCommand.js');

module.exports = function getVolume(params) {
  return sendCommand('getVolume', params);
};