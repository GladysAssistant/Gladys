var sendCommand = require('./music.sendCommand.js');

module.exports = function flushQueue(params) {
    return sendCommand('flushQueue', params);
};