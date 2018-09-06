var sendCommand = require('./television.sendCommand.js');

module.exports = function openSources(params) {
    return sendCommand('openSources', params);
};