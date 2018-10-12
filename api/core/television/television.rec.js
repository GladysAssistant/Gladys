var sendCommand = require('./television.sendCommand.js');

module.exports = function rec(params) {
  return sendCommand('rec', params);
};