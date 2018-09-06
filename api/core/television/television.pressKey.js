var sendCommand = require('./television.sendCommand.js');

module.exports = function pressKey(params) {
    return sendCommand('pressKey', params);
};