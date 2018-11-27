var sendCommand = require('./television.sendCommand.js');

module.exports = function openInfo(params) {
  return sendCommand('openInfo', params);
};