const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc'); // dependent on utc plugin
const timezone = require('dayjs/plugin/timezone');
const relativeTime = require('dayjs/plugin/relativeTime');
const logger = require('../../utils/logger');
const { EVENTS } = require('../../utils/constants');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

/**
 * @description Add Schedule job for sunset and sunrise for each house.
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
      const todayAt12InMyTimeZone = dayjs()
        .hour(12)
        .minute(0)
        .tz(this.timezone)
        .toDate();
      const times = this.sunCalc.getTimes(todayAt12InMyTimeZone, house.latitude, house.longitude);
      // Sunrise time
      const sunriseHour = dayjs(times.sunrise)
        .tz(this.timezone)
        .get('hour');
      const sunriseMinute = dayjs(times.sunrise)
        .tz(this.timezone)
        .get('minute');
      const sunriseTime = dayjs()
        .tz(this.timezone)
        .hour(sunriseHour)
        .minute(sunriseMinute)
        .toDate();
      // Sunset time
      const sunsetHour = dayjs(times.sunset)
        .tz(this.timezone)
        .get('hour');
      const sunsetMinute = dayjs(times.sunset)
        .tz(this.timezone)
        .get('minute');
      const sunsetTime = dayjs()
        .tz(this.timezone)
        .hour(sunsetHour)
        .minute(sunsetMinute)
        .toDate();
      logger.info(`Sunrise today is at ${sunriseHour}:${sunriseMinute} today, in your timezone = ${this.timezone}`);
      logger.info(`Sunset today is at ${sunsetHour}:${sunsetMinute} today, in your timezone = ${this.timezone}`);
      const sunriseJob = this.scheduler.scheduleJob(sunriseTime, () =>
        this.event.emit(EVENTS.TRIGGERS.CHECK, {
          type: EVENTS.TIME.SUNRISE,
          house,
        }),
      );
      if (sunriseJob) {
        logger.info(`Sunrise is scheduled, ${dayjs(sunriseTime).fromNow()}.`);
        this.jobs.push(sunriseJob);
      } else {
        logger.info(`The sun rose this morning. Not scheduling for today.`);
      }

      const sunsetJob = this.scheduler.scheduleJob(sunsetTime, () =>
        this.event.emit(EVENTS.TRIGGERS.CHECK, {
          type: EVENTS.TIME.SUNSET,
          house,
        }),
      );

      if (sunsetJob) {
        logger.info(`Sunset is scheduled, ${dayjs(sunsetTime).fromNow()}.`);
        this.jobs.push(sunsetJob);
      } else {
        logger.info(`The sun has already set. Not scheduling for today.`);
      }
    }
  });
}

module.exports = {
  dailyUpdate,
};
