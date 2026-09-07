/**
 * @description Cancel a trigger.
 * @param {object} sceneSelector - The selector of the scene to clean.
 * @example
 * this.cancelTriggers('test-scene');
 */
function cancelTriggers(sceneSelector) {
  // Clear the scene's pending `for_duration` timers: a stale timer would fire against
  // the old triggers and, as long as its key exists, prevent the same feature from
  // scheduling a fresh timer after the scene has been updated.
  const durationKeyPrefix = `device.new-state.${sceneSelector}.`;
  this.checkTriggersDurationTimer.forEach((timeoutId, key) => {
    if (key.startsWith(durationKeyPrefix)) {
      clearTimeout(timeoutId);
      this.checkTriggersDurationTimer.delete(key);
    }
  });
  if (this.scenes[sceneSelector] && this.scenes[sceneSelector].triggers) {
    this.scenes[sceneSelector].triggers.forEach((trigger) => {
      if (trigger.nodeScheduleJob) {
        trigger.nodeScheduleJob.cancel();
        delete trigger.nodeScheduleJob;
      }
      // A "time-range" trigger schedules two jobs per range: all of them must be
      // cancelled, otherwise an updated scene keeps firing on its former ranges.
      if (trigger.nodeScheduleJobs) {
        trigger.nodeScheduleJobs.forEach((job) => job.cancel());
        delete trigger.nodeScheduleJobs;
      }
      if (trigger.jsInterval) {
        clearInterval(trigger.jsInterval);
        delete trigger.jsInterval;
      }
      if (trigger.topic) {
        const mqttService = this.service.getService('mqtt');
        if (mqttService) {
          mqttService.device.unsubscribe(trigger.topic);
        }
      }
    });
  }
}

module.exports = {
  cancelTriggers,
};
