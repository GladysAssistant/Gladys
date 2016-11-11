var sendCommand = require('./music.sendCommand.js');

module.exports = function getCurrentTrack(params) {
    return sendCommand('getCurrentTrack', params);
};