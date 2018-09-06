var sendCommand = require('./television.sendCommand.js');

module.exports = function setChannel(params) {
    return sendCommand('setChannel', params);
};