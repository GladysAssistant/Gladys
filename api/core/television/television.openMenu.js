var sendCommand = require('./television.sendCommand.js');

module.exports = function openMenu(params) {
    return sendCommand('openMenu', params);
};