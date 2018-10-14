var sendCommand = require('./television.sendCommand.js');

module.exports = function getCurrentChannel(params) {
  return sendCommand('getCurrentChannel', params);
};