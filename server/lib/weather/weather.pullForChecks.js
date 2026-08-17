const { WEATHER_UNITS } = require('../../utils/constants');

/**
 * @description Open a shared-pull window: while at least one scene check
 * run is in flight, every weather pull of a given house is done once and
 * shared. The alert check (every 30 min) and the weather-trigger check
 * (every 15 min) land on the same tick every half hour and a freshness
 * nudge relaunches both at once: without this, the same house was pulled
 * twice from the provider on every overlap.
 * @example
 * this.beginSharedPulls();
 */
function beginSharedPulls() {
  this.sharedPullRuns += 1;
}

/**
 * @description Close a shared-pull window. The shared payloads are dropped
 * as soon as the last run ends: the sharing window is exactly the overlap
 * of the runs, so a check never compares against data older than its own
 * poll (a freshness nudge landing after the runs pulls for real).
 * @example
 * this.endSharedPulls();
 */
function endSharedPulls() {
  this.sharedPullRuns = Math.max(0, this.sharedPullRuns - 1);
  if (this.sharedPullRuns === 0) {
    this.checkPulls.clear();
  }
}

/**
 * @description Pull the weather of a house for the scene checks, through
 * the normal provider loop, sharing one call with any other check run
 * currently in flight.
 * @param {object} house - The house to pull, with its coordinates.
 * @returns {Promise} Resolves with the normalized pivot weather.
 * @example
 * const weather = await this.pullForChecks(house);
 */
function pullForChecks(house) {
  const sharedPull = this.checkPulls.get(house.selector);
  if (sharedPull !== undefined) {
    return sharedPull;
  }
  // the promise itself is shared, so two runs starting on the same tick
  // wait on one provider call instead of racing two
  const pull = this.get({
    latitude: house.latitude,
    longitude: house.longitude,
    language: 'en',
    units: WEATHER_UNITS.METRIC,
  });
  this.checkPulls.set(house.selector, pull);
  return pull;
}

module.exports = {
  beginSharedPulls,
  endSharedPulls,
  pullForChecks,
};
