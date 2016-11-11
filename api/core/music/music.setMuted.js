var sendCommand = require('./music.sendCommand.js');

module.exports = function setMuted(params) {
    return sendCommand('setMuted', params);
};