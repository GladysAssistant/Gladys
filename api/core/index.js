var events = require('events');

var gladys = {};
gladys = new events.EventEmitter();

gladys.load = function load () {
    gladys.device = require('./device/index.js');
    gladys.notification = require('./notification/index.js');
    gladys.scheduler = require('./scheduler/index.js');
};

module.exports = gladys;