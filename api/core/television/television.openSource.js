var sendCommand = require('./television.sendCommand.js');

module.exports = function openSource(params) {
  return sendCommand('openSource', params);
};