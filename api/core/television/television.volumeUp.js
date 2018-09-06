var sendCommand = require('./television.sendCommand.js');

module.exports = function volumeUp(params) {
    return sendCommand('volumeUp', params);
};