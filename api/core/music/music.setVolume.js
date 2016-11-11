var sendCommand = require('./music.sendCommand.js');

module.exports = function setVolume(params) {
    return sendCommand('setVolume', params);
};