var sendCommand = require('./music.sendCommand.js');

module.exports = function getQueue(params) {
  return sendCommand('getQueue', params);
};