var sendCommand = require('./music.sendCommand.js');

module.exports = function getMuted(params) {
    return sendCommand('getMuted', params);
};