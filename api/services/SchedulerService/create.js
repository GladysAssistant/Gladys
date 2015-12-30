var schedule = require('node-schedule');
var shared = require('./shared.js');

module.exports = function create (options) {
    shared.tabScheduler[shared.tabScheduler.length] = schedule.scheduleJob(options.rule, function(){
		ScenarioService.launcher(options.eventName, options.value);
	});
	
    // return index of the job
    return Promise.resolve(shared.tabScheduler.length - 1);
};