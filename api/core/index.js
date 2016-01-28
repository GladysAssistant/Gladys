var events = require('events');

var gladys = {};
gladys = new events.EventEmitter();

gladys.on('sailsReady', function(){
    gladys.device = require('./device/index.js');
    gladys.notification = require('./notification/index.js');
});

module.exports = gladys;