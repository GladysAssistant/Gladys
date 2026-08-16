const Promise = require('bluebird');
const db = require('../../models');
const logger = require('../../utils/logger');
const { EVENTS } = require('../../utils/constants');

/**
 * @description The actual check, always called under the in-flight guard
 * of checkTriggers.
 * @returns {Promise} Resolves when every house has been checked.
 * @example
 * await runCheck.call(this);
 */
async function runCheck() {
  // same gate as the alert check: a LIKE probe on the JSON column is
  // dialect-dependent, so the trigger types are checked in JS on the
  // active scenes — a light query, ran at most every 15 min
  const activeScenes = await db.Scene.findAll({
    where: { active: true },
    attributes: ['triggers'],
  });
  // the triggers column is NOT NULL: every scene carries an array. Only
  // the houses actually watched by a trigger are polled: a trigger matches
  // on its own house, so polling the others would buy nothing and cost a
  // provider call every 15 min
  const watchedHouses = new Set();
  activeScenes.forEach((scene) =>
    scene.triggers.forEach((trigger) => {
      if (trigger.type === EVENTS.WEATHER.MATCHED && trigger.house) {
        watchedHouses.add(trigger.house);
      }
    }),
  );
  if (watchedHouses.size === 0) {
    this.houseWeather.clear();
    return;
  }
  const houses = await this.house.get();
  const housesToCheck = houses.filter(
    (house) => house.latitude !== null && house.longitude !== null && watchedHouses.has(house.selector),
  );
  // a house leaving the watched set (scene deactivated, trigger removed)
  // drops its baseline: coming back, its first poll re-baselines instead
  // of comparing against a payload from another day
  const checkedSelectors = new Set(housesToCheck.map((house) => house.selector));
  this.houseWeather.forEach((payload, selector) => {
    if (!checkedSelectors.has(selector)) {
      this.houseWeather.delete(selector);
    }
  });
  await Promise.each(housesToCheck, async (house) => {
    let weather;
    try {
      // shared with the alert check when both run at once
      weather = await this.pullForChecks(house);
    } catch (e) {
      // no provider configured or provider down: nothing to compare, the
      // previous payload is kept so recovery does not fire a scene on a
      // transition the user never lived
      logger.debug(`weather.checkTriggers: no weather for house ${house.selector}: ${e.message}`);
      return;
    }
    const previousWeather = this.houseWeather.get(house.selector);
    this.houseWeather.set(house.selector, weather);
    if (previousWeather === undefined) {
      // first poll of the house: baseline only, a core restart while it is
      // already raining must not re-run every weather scene
      return;
    }
    this.event.emit(EVENTS.TRIGGERS.CHECK, {
      type: EVENTS.WEATHER.MATCHED,
      house: house.selector,
      weather,
      previous_weather: previousWeather,
    });
  });
}

/**
 * @description Poll the weather of the houses watched by a weather scene
 * trigger and feed the trigger with the current and the previous payload,
 * so the scene engine only fires on a transition. Runs every 15 minutes
 * (scheduler job check-weather-triggers) and on an integration freshness
 * nudge. Gated: no active scene with a weather trigger means zero
 * third-party calls, and a house no trigger watches is never polled. The
 * pull is shared with the alert check when both run at once.
 * @returns {Promise} Resolves when every house has been checked.
 * @example
 * await weather.checkTriggers();
 */
async function checkTriggers() {
  // the scheduled job and the freshness nudge both land here: two
  // overlapping runs would compare against the same previous payload and
  // could fire the same transition twice, so a run already in flight wins
  // and the new one is dropped (a dropped nudge costs at most the 15-min
  // floor)
  if (this.checkTriggersRunning) {
    return;
  }
  this.checkTriggersRunning = true;
  this.beginSharedPulls();
  try {
    await runCheck.call(this);
  } finally {
    this.endSharedPulls();
    this.checkTriggersRunning = false;
  }
}

module.exports = {
  checkTriggers,
};
