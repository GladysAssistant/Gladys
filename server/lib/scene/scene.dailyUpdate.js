const { EVENTS } = require('../../utils/constants');

/**
 * @description Add Schedule job for sunset and sunrise for each house
 * @returns {Promise} Resolve when success.
 * @example
 * scene.dailyUpdate();
 */
async function dailyUpdate() {
  this.jobs.forEach((job) => {
    job.cancel();
  });
  this.jobs = [];

  const houses = await this.house.get();

  houses.forEach((house) => {
    if (house.latitude !== null && house.longitude !== null) {
      const times = this.sunCalc.getTimes(new Date(), house.latitude, house.longitude);

      const sunriseJob = this.schedule.scheduleJob(times.sunrise, () =>
        this.event.emit(EVENTS.TRIGGERS.CHECK, {
          type: EVENTS.TIME.SUNRISE,
          house,
        }),
      );
      if (sunriseJob) {
        this.jobs.push(sunriseJob);
      }

      const sunsetJob = this.schedule.scheduleJob(times.sunset, () =>
        this.event.emit(EVENTS.TRIGGERS.CHECK, {
          type: EVENTS.TIME.SUNSET,
          house,
        }),
      );

      if (sunsetJob) {
        this.jobs.push(sunsetJob);
      }
    }
  });
}

module.exports = {
  dailyUpdate,
};
