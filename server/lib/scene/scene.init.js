const db = require('../../models');
const { SYSTEM_VARIABLE_NAMES, EVENTS } = require('../../utils/constants');
const logger = require('../../utils/logger');

/**
 * @description Load all scenes from the database to the trigger store.
 * @returns {Promise} Resolve when success.
 * @example
 * scene.init();
 */
async function init() {
  logger.debug('Scene.init');
  // get timezone settings
  const timezone = await this.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE);
  if (timezone) {
    this.timezone = timezone;
  }
  // get all scenes
  const scenes = await db.Scene.findAll();
  const plainScenes = scenes.map((scene) => {
    const plainScene = scene.get({ plain: true });
    this.addScene(plainScene);
    return plainScene;
  });

  // Recurrence rule (00:00 every day) to update sunrise/sunset time.
  const rule = new this.schedule.RecurrenceRule();
  rule.tz = this.timezone;
  rule.hour = 0;
  rule.minute = 0;
  rule.second = 0;

  this.schedule.scheduleJob(rule, this.dailyUpdate.bind(this));
  await this.dailyUpdate();

  //  At every minute, check if calendar event is coming
  this.schedule.scheduleJob('* * * * *', () => this.event.emit(EVENTS.CALENDAR.CHECK_IF_EVENT_IS_COMING));

  return plainScenes;
}

module.exports = {
  init,
};
