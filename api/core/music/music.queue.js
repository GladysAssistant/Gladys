var sendCommand = require('./music.sendCommand.js');

module.exports = function queue(params) {
  return sendCommand('queue', params);
};