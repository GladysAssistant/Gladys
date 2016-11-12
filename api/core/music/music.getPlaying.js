var sendCommand = require('./music.sendCommand.js');

module.exports = function getPlaying(params) {
    return sendCommand('getPlaying', params);
};