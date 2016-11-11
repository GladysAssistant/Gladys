var sendCommand = require('./music.sendCommand.js');

module.exports = function play(params) {
    return sendCommand('play', params);
};