var events = require('events');

var gladys = {};
gladys = new events.EventEmitter();

gladys.device = require('./device/index.js');

module.exports = gladys;