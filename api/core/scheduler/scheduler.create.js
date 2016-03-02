var schedule = require('node-schedule');
var shared = require('./shared.js');

module.exports = function create(options) {

    if (!options || !options.eventName || !options.rule) {
        return Promise.reject(new Error('Wrong parameters, need rule and eventName.'));
    }

    // we schedule a new job with node schedule, and save it in the shared object
    // to be able to disable it
    shared.tabScheduler[shared.tabScheduler.length] = schedule.scheduleJob(options.rule, function() {
        gladys.scenario.start(options.eventName, options.value);
    });

    // return index of the job
    return Promise.resolve(shared.tabScheduler.length - 1);
};
