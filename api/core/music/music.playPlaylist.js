var sendCommand = require('./music.sendCommand.js');

module.exports = function playPlaylist(params) {
    return sendCommand('playPlaylist', params);
};