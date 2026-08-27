const { EVENTS, TIME_RANGE_EVENTS } = require('../../utils/constants');
const logger = require('../../utils/logger');

/**
 * @description Re-evaluate the "time-range" triggers which asked for it, at Gladys startup.
 *
 * The jobs of a time range are scheduled for the future only: a range which started (or
 * ended) while Gladys was down is never replayed, so a scene driving a device from a
 * planning would stay out of sync until the next boundary — a pool pump stopped by a power
 * cut would stay off for the rest of the range, and one left on would keep running long
 * after the range ended.
 *
 * When `resume_on_startup` is enabled, the scene is therefore executed once at startup with
 * `range_event = 'resume'` and `in_range` telling whether we are currently inside one of the
 * ranges. The scene decides what to do with it: Gladys does not know which device it drives,
 * and re-applying the wanted state is both simpler and safer than guessing.
 * @example
 * scene.resumeTimeRangeTriggers();
 */
function resumeTimeRangeTriggers() {
  // init() also runs when the user changes the timezone in the settings. Re-applying the
  // planning then would run these scenes again for no reason — and a scene whose "resume"
  // branch sends a notification would notify on a settings change. It only makes sense
  // once, when Gladys starts.
  if (this.timeRangeTriggersResumed) {
    return;
  }
  this.timeRangeTriggersResumed = true;

  Object.keys(this.scenes).forEach((sceneSelector) => {
    const scene = this.scenes[sceneSelector];
    if (!scene.active || !scene.triggers) {
      return;
    }
    // A scene resumes once, even with several time-range triggers asking for it: emitting
    // per trigger would run the whole scene twice at boot, double-applying the state of the
    // device it drives and sending its notifications twice. The first trigger is the one
    // emitted, and which one it is does not matter: `in_range` is computed in scene.triggers
    // from the ranges of EVERY time-range trigger of the scene, so a "weekdays + weekend"
    // planning — necessarily two triggers, as the days are configured per trigger — answers
    // for the whole planning rather than for the trigger which happens to come first.
    const triggerToResume = scene.triggers.find(
      (trigger) =>
        trigger.type === EVENTS.TIME.CHANGED &&
        trigger.scheduler_type === 'time-range' &&
        trigger.resume_on_startup === true,
    );
    if (!triggerToResume) {
      return;
    }
    logger.info(`Scene ${scene.name}: re-evaluating time-range trigger at startup.`);
    // Like the scheduled jobs, only the identity of the trigger is emitted: the trigger
    // object holds the scheduled jobs, which have nothing to do on the event bus.
    this.event.emit(EVENTS.TRIGGERS.CHECK, {
      type: triggerToResume.type,
      key: triggerToResume.key,
      scheduler_type: triggerToResume.scheduler_type,
      range_event: TIME_RANGE_EVENTS.RESUME,
    });
  });
}

module.exports = {
  resumeTimeRangeTriggers,
};
