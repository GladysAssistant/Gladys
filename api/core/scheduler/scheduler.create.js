var schedule = require('node-schedule');
var shared = require('./shared.js');

module.exports = function create(options) {

    if (!options || !options.event || !options.rule) {
        return Promise.reject(new Error('Wrong parameters, need event and rule'));
    }

    // we schedule a new job with node schedule, and save it in the shared object
    // to be able to disable it
    shared.tabScheduler[shared.tabScheduler.length] = schedule.scheduleJob(options.rule, function() {
        gladys.event.create(options.event);
    });

    // return index of the job
    return Promise.resolve(shared.tabScheduler.length - 1);
};
