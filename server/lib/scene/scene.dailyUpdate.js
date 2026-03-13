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
      // Sunrise and Sunset base times
      const sunriseBase = dayjs(times.sunrise).tz(this.timezone);
      const sunsetBase = dayjs(times.sunset).tz(this.timezone);
      logger.info(
        `Sunrise today is at ${sunriseBase.get('hour')}:${sunriseBase.get('minute')} today, in your timezone = ${
          this.timezone
        }`,
      );
      logger.info(
        `Sunset today is at ${sunsetBase.get('hour')}:${sunsetBase.get('minute')} today, in your timezone = ${
          this.timezone
        }`,
      );

      // Collect all distinct offsets for this house from active scene triggers
      const sunriseOffsets = new Set([0]);
      const sunsetOffsets = new Set([0]);
      Object.values(this.scenes).forEach((scene) => {
        if (!scene.active || !scene.triggers) {
          return;
        }
        scene.triggers.forEach((trigger) => {
          const offset = trigger.offset || 0;
          if (trigger.type === EVENTS.TIME.SUNRISE && trigger.house === house.selector) {
            sunriseOffsets.add(offset);
          } else if (trigger.type === EVENTS.TIME.SUNSET && trigger.house === house.selector) {
            sunsetOffsets.add(offset);
          }
        });
      });

      // Schedule one job per distinct (house, type, offset) combination
      sunriseOffsets.forEach((offset) => {
        const sunriseTime = sunriseBase.add(offset, 'minute').toDate();
        const sunriseJob = this.scheduler.scheduleJob(sunriseTime, () =>
          this.event.emit(EVENTS.TRIGGERS.CHECK, {
            type: EVENTS.TIME.SUNRISE,
            house,
            offset,
          }),
        );
        if (sunriseJob) {
          logger.info(`Sunrise (offset ${offset}min) is scheduled, ${dayjs(sunriseTime).fromNow()}.`);
          this.jobs.push(sunriseJob);
        } else {
          logger.info(`Sunrise (offset ${offset}min): time is in the past, not scheduling for today.`);
        }
      });

      sunsetOffsets.forEach((offset) => {
        const sunsetTime = sunsetBase.add(offset, 'minute').toDate();
        const sunsetJob = this.scheduler.scheduleJob(sunsetTime, () =>
          this.event.emit(EVENTS.TRIGGERS.CHECK, {
            type: EVENTS.TIME.SUNSET,
            house,
            offset,
          }),
        );
        if (sunsetJob) {
          logger.info(`Sunset (offset ${offset}min) is scheduled, ${dayjs(sunsetTime).fromNow()}.`);
          this.jobs.push(sunsetJob);
        } else {
          logger.info(`Sunset (offset ${offset}min): time is in the past, not scheduling for today.`);
        }
      });
    }
  });
}

module.exports = {
  dailyUpdate,
};
