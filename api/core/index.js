var events = require('events');
var fs = require('fs');

var gladys = {};
gladys = new events.EventEmitter();

gladys.load = function load () {
    
    // require all Gladys dependencies
    gladys.alarm = require('./alarm/index.js');
    gladys.device = require('./device/index.js');
    gladys.lifeEvent = require('./lifeevent/index.js');
    gladys.notification = require('./notification/index.js');
    gladys.scenario = require('./scenario/index.js');
    gladys.scheduler = require('./scheduler/index.js');
    gladys.script = require('./script/index.js');
    gladys.update = require('./update/index.js');
    gladys.utils = require('./utils/index.js');
    
    // get Gladys version number
    try {
        var json = JSON.parse(fs.readFileSync('package.json'));
        gladys.version = json.version;
        sails.log.info('Gladys version : ' + gladys.version);
    } catch(e) {
        sails.log.warn('Cannot parse package.json');
    }
    gladys.emit('ready');
};

module.exports = gladys;