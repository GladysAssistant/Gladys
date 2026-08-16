const Promise = require('bluebird');
const db = require('../../models');
const logger = require('../../utils/logger');
const { EVENTS, WEATHER_UNITS } = require('../../utils/constants');

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
  // the triggers column is NOT NULL: every scene carries an array
  const someSceneListens = activeScenes.some((scene) =>
    scene.triggers.some((trigger) => trigger.type === EVENTS.WEATHER.MATCHED),
  );
  if (!someSceneListens) {
    return;
  }
  const houses = await this.house.get();
  const locatedHouses = houses.filter((house) => house.latitude !== null && house.longitude !== null);
  await Promise.each(locatedHouses, async (house) => {
    let weather;
    try {
      weather = await this.get({
        latitude: house.latitude,
        longitude: house.longitude,
        language: 'en',
        units: WEATHER_UNITS.METRIC,
      });
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
 * @description Poll the weather of every located house and feed the
 * dedicated weather scene trigger with the current and the previous
 * payload, so the scene engine only fires on a transition. Runs every 15
 * minutes (scheduler job check-weather-triggers) and on an integration
 * freshness nudge. Gated: no active scene with a weather trigger means
 * zero third-party calls.
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
  try {
    await runCheck.call(this);
  } finally {
    this.checkTriggersRunning = false;
  }
}

module.exports = {
  checkTriggers,
};
