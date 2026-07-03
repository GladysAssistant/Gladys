const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc'); // dependent on utc plugin
const timezone = require('dayjs/plugin/timezone');
const relativeTime = require('dayjs/plugin/relativeTime');
const logger = require('../../utils/logger');
const { EVENTS } = require('../../utils/constants');
const { findSunPositionTimes } = require('../sun/sunPosition');

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
        .tz(this.timezone)
        .hour(12)
        .minute(0)
        .second(0)
        .toDate();
      const times = this.sunCalc.getTimes(todayAt12InMyTimeZone, house.latitude, house.longitude);
      // Sunrise and Sunset base times
      const sunriseBase = dayjs(times.sunrise).tz(this.timezone);
      const sunsetBase = dayjs(times.sunset).tz(this.timezone);
      logger.info(`Sunrise today is at ${sunriseBase.format('HH:mm')}, in your timezone = ${this.timezone}`);
      logger.info(`Sunset today is at ${sunsetBase.format('HH:mm')}, in your timezone = ${this.timezone}`);

      // Collect all distinct offsets for this house from active scene triggers
      const sunriseOffsets = new Set([0]);
      const sunsetOffsets = new Set([0]);
      Object.values(this.scenes).forEach((scene) => {
        if (!scene.active || !scene.triggers) {
          return;
        }
        scene.triggers.forEach((trigger) => {
          const offset = Number(trigger.offset) || 0;
          if (!Number.isInteger(offset) || Math.abs(offset) > 24 * 60) {
            return;
          }
          if (trigger.type === EVENTS.TIME.SUNRISE && trigger.house === house.selector) {
            sunriseOffsets.add(offset);
          } else if (trigger.type === EVENTS.TIME.SUNSET && trigger.house === house.selector) {
            sunsetOffsets.add(offset);
          }
        });
      });

      // Schedule one job per distinct (house, type, offset) combination
      const scheduleForOffsets = (offsets, baseTime, eventType, label) => {
        offsets.forEach((offset) => {
          const time = baseTime.add(offset, 'minute').toDate();
          const job = this.scheduler.scheduleJob(time, () =>
            this.event.emit(EVENTS.TRIGGERS.CHECK, { type: eventType, house, offset }),
          );
          if (job) {
            logger.info(
              `${label} (offset ${offset}min) is scheduled at ${dayjs(time)
                .tz(this.timezone)
                .format('HH:mm')}, ${dayjs(time).fromNow()}.`,
            );
            this.jobs.push(job);
          } else {
            logger.info(`${label} (offset ${offset}min): time is in the past, not scheduling for today.`);
          }
        });
      };

      scheduleForOffsets(sunriseOffsets, sunriseBase, EVENTS.TIME.SUNRISE, 'Sunrise');
      scheduleForOffsets(sunsetOffsets, sunsetBase, EVENTS.TIME.SUNSET, 'Sunset');

      // Schedule sun position triggers (altitude + azimuth)
      const sunPositionTriggers = [];
      Object.values(this.scenes).forEach((scene) => {
        if (!scene.active || !scene.triggers) {
          return;
        }
        scene.triggers.forEach((trigger) => {
          if (trigger.type === EVENTS.TIME.SUN_POSITION && trigger.house === house.selector) {
            const altitude = Number(trigger.altitude);
            const azimuth = Number(trigger.azimuth);
            if (
              Number.isFinite(altitude) &&
              altitude >= -90 &&
              altitude <= 90 &&
              Number.isFinite(azimuth) &&
              azimuth >= 0 &&
              azimuth < 360
            ) {
              sunPositionTriggers.push({ altitude, azimuth });
            }
          }
        });
      });

      const scheduledSunPositions = new Set();
      sunPositionTriggers.forEach(({ altitude, azimuth }) => {
        const key = `${altitude}:${azimuth}`;
        if (scheduledSunPositions.has(key)) {
          return;
        }
        scheduledSunPositions.add(key);

        const times = findSunPositionTimes(
          this.sunCalc,
          house.latitude,
          house.longitude,
          this.timezone,
          altitude,
          azimuth,
        );

        times.forEach((time) => {
          const job = this.scheduler.scheduleJob(time, () =>
            this.event.emit(EVENTS.TRIGGERS.CHECK, {
              type: EVENTS.TIME.SUN_POSITION,
              house,
              altitude,
              azimuth,
            }),
          );
          if (job) {
            logger.info(
              `Sun position (altitude ${altitude}°, azimuth ${azimuth}°) is scheduled at ${dayjs(time)
                .tz(this.timezone)
                .format('HH:mm')}, ${dayjs(time).fromNow()}.`,
            );
            this.jobs.push(job);
          } else {
            logger.info(
              `Sun position (altitude ${altitude}°, azimuth ${azimuth}°): time is in the past, not scheduling for today.`,
            );
          }
        });

        if (times.length === 0) {
          logger.info(
            `Sun position (altitude ${altitude}°, azimuth ${azimuth}°): no matching time found today for this house.`,
          );
        }
      });
    }
  });
}

module.exports = {
  dailyUpdate,
};
