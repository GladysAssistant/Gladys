var sendCommand = require('./music.sendCommand.js');

module.exports = function getPlaylists(params) {
    return sendCommand('getPlaylists', params);
};