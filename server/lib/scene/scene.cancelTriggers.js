/**
 * @description Cancel a trigger.
 * @param {Object} sceneSelector - The selector of the scene to clean.
 * @example
 * this.cancelTriggers('test-scene');
 */
function cancelTriggers(sceneSelector) {
  if (this.scenes[sceneSelector] && this.scenes[sceneSelector].triggers) {
    this.scenes[sceneSelector].triggers.forEach((trigger) => {
      if (trigger.nodeScheduleJob) {
        trigger.nodeScheduleJob.cancel();
        delete trigger.nodeScheduleJob;
      }
      if (trigger.jsInterval) {
        clearInterval(trigger.jsInterval);
        delete trigger.jsInterval;
      }
    });
  }
}

module.exports = {
  cancelTriggers,
};
