var sendCommand = require('./television.sendCommand.js');

module.exports = function getChannel(params) {
    return sendCommand('getChannel', params);
};