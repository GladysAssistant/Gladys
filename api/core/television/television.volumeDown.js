var sendCommand = require('./television.sendCommand.js');

module.exports = function volumeDown(params) {
    return sendCommand('volumeDown', params);
};