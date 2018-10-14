var shared = require('./shared.js');

module.exports = function destroy(options) {

  // test if job exist
  if (shared.tabScheduler[options.index] === undefined) {
    return Promise.reject(new Error('This job does not exist'));
  }

  // cancel job
  shared.tabScheduler[options.index].cancel();

  // remove job from array
  shared.tabScheduler = shared.tabScheduler.splice(options.index, 1);

  return Promise.resolve();
};
