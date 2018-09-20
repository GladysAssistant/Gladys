var sendCommand = require('./television.sendCommand.js');
const Promise = require('bluebird');

module.exports = function customCommand(params) {
    if(params.color === 'red') return sendCommand('redButton', params);
    else if(params.color === 'green') return sendCommand('greenButton', params);
    else if(params.color === 'yellow') return sendCommand('yellowButton', params);
    else if(params.color === 'blue') return sendCommand('blueButton', params);
    else sails.log.error('television : Button '+params.color+' not exist'); return Promise.reject();
};