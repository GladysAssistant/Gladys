var sendCommand = require('./television.sendCommand.js');

module.exports = function switchState(params) {
    return sendCommand('switchState', params);
};