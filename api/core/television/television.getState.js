var sendCommand = require('./television.sendCommand.js');

module.exports = function getState(params) {
    return sendCommand('getState', params);
};