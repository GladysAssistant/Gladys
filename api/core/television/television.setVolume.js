var sendCommand = require('./television.sendCommand.js');

module.exports = function setVolume(params) {
    return sendCommand('setVolume', params);
};