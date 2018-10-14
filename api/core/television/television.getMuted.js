var sendCommand = require('./television.sendCommand.js');

module.exports = function getMuted(params) {
  return sendCommand('getMuted', params);
};