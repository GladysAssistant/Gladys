const schedule = require('node-schedule');
const { EVENTS } = require('../../utils/constants');

/**
 * @description Add Schedule job for sunset and sunrise for each house
 * @returns {Promise} Resolve when success.
 * @example
 * scene.dailyUpdate();
 */
async function dailyUpdate() {
  const houses = await this.house.get();

  const jobs = [];

  houses.forEach((house) => {
    const times = this.sunCalc.getTimes(new Date(), house.latitude, house.longitude);

    jobs.push(
      schedule.scheduleJob(times.sunrise, () =>
        this.event.emit(EVENTS.TRIGGERS.CHECK, {
          type: EVENTS.TIME.SUNRISE,
          house,
        }),
      ),
    );

    jobs.push(
      schedule.scheduleJob(times.sunset, () =>
        this.event.emit(EVENTS.TRIGGERS.CHECK, {
          type: EVENTS.TIME.SUNSET,
          house,
        }),
      ),
    );
  });
  return jobs;
}

module.exports = {
  dailyUpdate,
};
