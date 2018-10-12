var sendCommand = require('./television.sendCommand.js');

module.exports = function getSources(params) {
  return sendCommand('getSources', params);
};