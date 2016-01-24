var events = require('events');

var gladys = {test:1};
gladys = new events.EventEmitter();

module.exports = gladys;
