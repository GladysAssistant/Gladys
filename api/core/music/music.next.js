var sendCommand = require('./music.sendCommand.js');

module.exports = function next(params) {
    return sendCommand('next', params);
};