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
      const sunrisePlus1Time = dayjs(sunriseTime)
        .add(1, 'hour')
        .toDate();
      const sunriseMinus1Time = dayjs(sunriseTime)
        .add(-1, 'hour')
        .toDate();
      const sunsetPlus1Time = dayjs(sunsetTime)
        .add(1, 'hour')
        .toDate();
      const sunsetMinus1Time = dayjs(sunsetTime)
        .add(-1, 'hour')
        .toDate();

      const sunriseJob = this.schedule.scheduleJob(sunriseTime, () =>
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
      const sunrisePlus1Job = this.schedule.scheduleJob(sunrisePlus1Time, () =>
        this.event.emit(EVENTS.TRIGGERS.CHECK, {
          type: EVENTS.TIME.SUNRISE_PLUS_1,
          house,
        }),
      );
      if (sunrisePlus1Job) {
        logger.info(`Sunrise + 1 is scheduled, ${dayjs(sunrisePlus1Time).fromNow()}.`);
        this.jobs.push(sunrisePlus1Job);
      } else {
        logger.info(`The sun rose this morning + 1. Not scheduling for today.`);
      }
      const sunriseMinus1Job = this.schedule.scheduleJob(sunriseMinus1Time, () =>
        this.event.emit(EVENTS.TRIGGERS.CHECK, {
          type: EVENTS.TIME.SUNRISE_MINUS_1,
          house,
        }),
      );
      if (sunriseMinus1Job) {
        logger.info(`Sunrise - 1 is scheduled, ${dayjs(sunriseMinus1Time).fromNow()}.`);
        this.jobs.push(sunriseMinus1Job);
      } else {
        logger.info(`The sun rose this morning - 1. Not scheduling for today.`);
      }

      const sunsetJob = this.schedule.scheduleJob(sunsetTime, () =>
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
      const sunsetPlus1Job = this.schedule.scheduleJob(sunsetPlus1Time, () =>
        this.event.emit(EVENTS.TRIGGERS.CHECK, {
          type: EVENTS.TIME.SUNSET_PLUS_1,
          house,
        }),
      );
      if (sunsetPlus1Job) {
        logger.info(`Sunset + 1 is scheduled, ${dayjs(sunsetPlus1Time).fromNow()}.`);
        this.jobs.push(sunsetPlus1Job);
      } else {
        logger.info(`The sun has already set. Not scheduling for today.`);
      }
      const sunsetMinus1Job = this.schedule.scheduleJob(sunsetMinus1Time, () =>
        this.event.emit(EVENTS.TRIGGERS.CHECK, {
          type: EVENTS.TIME.SUNSET_MINUS_1,
          house,
        }),
      );
      if (sunsetMinus1Job) {
        logger.info(`Sunset - 1 is scheduled, ${dayjs(sunsetMinus1Time).fromNow()}.`);
        this.jobs.push(sunsetMinus1Job);
      } else {
        logger.info(`The sun has already set. Not scheduling for today.`);
      }
    }
  });
}

module.exports = {
  dailyUpdate,
};
