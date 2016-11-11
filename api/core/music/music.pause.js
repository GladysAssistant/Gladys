var sendCommand = require('./music.sendCommand.js');

module.exports = function pause(params) {
    return sendCommand('pause', params);
};