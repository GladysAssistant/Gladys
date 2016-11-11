var sendCommand = require('./music.sendCommand.js');

module.exports = function previous(params) {
    return sendCommand('previous', params);
};