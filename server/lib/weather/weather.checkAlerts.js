const Promise = require('bluebird');
const db = require('../../models');
const logger = require('../../utils/logger');
const { EVENTS } = require('../../utils/constants');

const SEVERITY_RANK = {
  minor: 1,
  moderate: 2,
  severe: 3,
  extreme: 4,
};

/**
 * @description Diff identity of an alert: the phenomenon type when present,
 * the normalized event text otherwise.
 * @param {object} alert - A normalized pivot alert.
 * @returns {string} The diff key.
 * @example
 * alertKey({ type: 'wind', event: 'Vent violent', severity: 'severe' });
 */
function alertKey(alert) {
  return alert.type || `event:${alert.event.trim().toLowerCase()}`;
}

/**
 * @description The actual check, always called under the in-flight guard
 * of checkAlerts.
 * @returns {Promise} Resolves when every house has been checked.
 * @example
 * await runCheck.call(this);
 */
async function runCheck() {
  // a LIKE probe on the JSON column is dialect-dependent (sequelize
  // JSON-serializes the pattern): the trigger types are checked in JS on
  // the active scenes instead — a light query, ran at most every 30 min
  const activeScenes = await db.Scene.findAll({
    where: { active: true },
    attributes: ['triggers'],
  });
  // the triggers column is NOT NULL: every scene carries an array
  const someSceneListens = activeScenes.some((scene) =>
    scene.triggers.some(
      (trigger) => trigger.type === EVENTS.WEATHER.ALERT_RAISED || trigger.type === EVENTS.WEATHER.ALERT_ENDED,
    ),
  );
  if (!someSceneListens) {
    return;
  }
  const houses = await this.house.get();
  const locatedHouses = houses.filter((house) => house.latitude !== null && house.longitude !== null);
  await Promise.each(locatedHouses, async (house) => {
    let weather;
    try {
      // shared with the weather-trigger check when both run at once
      weather = await this.pullForChecks(house);
    } catch (e) {
      // no provider configured or provider down: nothing to diff, the
      // previous baseline is kept so recovery does not re-fire scenes
      logger.debug(`weather.checkAlerts: no weather for house ${house.selector}: ${e.message}`);
      return;
    }
    const alerts = weather.alerts || [];
    const previous = this.houseAlerts.get(house.selector);
    this.houseAlerts.set(house.selector, alerts);
    if (previous === undefined) {
      return;
    }
    const previousByKey = new Map(previous.map((alert) => [alertKey(alert), alert]));
    const currentByKey = new Map(alerts.map((alert) => [alertKey(alert), alert]));
    currentByKey.forEach((alert, key) => {
      const before = previousByKey.get(key);
      if (before === undefined || SEVERITY_RANK[alert.severity] > SEVERITY_RANK[before.severity]) {
        this.event.emit(EVENTS.TRIGGERS.CHECK, {
          type: EVENTS.WEATHER.ALERT_RAISED,
          house: house.selector,
          alert,
        });
      }
    });
    previousByKey.forEach((alert, key) => {
      if (!currentByKey.has(key)) {
        this.event.emit(EVENTS.TRIGGERS.CHECK, {
          type: EVENTS.WEATHER.ALERT_ENDED,
          house: house.selector,
          alert,
        });
      }
    });
  });
}

/**
 * @description Poll the weather of every located house and diff the
 * normalized alerts against the previous poll, firing the weather-alert
 * scene triggers (B.18 point 4). Runs every 30 minutes (scheduler job
 * check-weather-alerts) and on an integration freshness nudge. Gated: no
 * active scene with a weather-alert trigger means zero third-party calls.
 * A new alert or a severity increase fires weather.alert-raised, a
 * disappeared alert fires weather.alert-ended, a de-escalation that does
 * not clear the alert fires nothing. The first poll of a house is a
 * baseline: no events, so a core restart during an ongoing alert never
 * re-fires the scenes.
 * @returns {Promise} Resolves when every house has been checked.
 * @example
 * await weather.checkAlerts();
 */
async function checkAlerts() {
  // the scheduled job and the freshness nudge both land here: two
  // overlapping runs would diff the same baseline and fire every
  // transition twice, so a run already in flight wins and the new one
  // is dropped (a dropped nudge costs at most the 30-min floor)
  if (this.checkAlertsRunning) {
    return;
  }
  this.checkAlertsRunning = true;
  this.beginSharedPulls();
  try {
    await runCheck.call(this);
  } finally {
    this.endSharedPulls();
    this.checkAlertsRunning = false;
  }
}

module.exports = {
  checkAlerts,
};
