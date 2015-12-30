var shared = require('./shared.js');

module.exports = function cancel (options) {
    return Promise.resolve(shared.tabScheduler[options.index].cancel());
};