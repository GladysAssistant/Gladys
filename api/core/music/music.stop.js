var sendCommand = require('./music.sendCommand.js');

module.exports = function stop(params) {
    return sendCommand('stop', params);
};