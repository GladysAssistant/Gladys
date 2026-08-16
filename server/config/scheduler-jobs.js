const { EVENTS } = require('../utils/constants');

const jobs = [
  {
    name: 'check-gladys-upgrade',
    rule: '0 0 */6 * * *', // every 6 hours
    event: EVENTS.SYSTEM.CHECK_UPGRADE,
  },
  {
    name: 'purge-device-states',
    rule: '0 0 4 * * *', // At 4 AM every day
    event: EVENTS.DEVICE.PURGE_STATES,
  },
  {
    name: 'daily-purge-of-old-jobs',
    rule: '0 0 22 * * *', // every day at 22:00
    event: EVENTS.JOB.PURGE_OLD_JOBS,
  },
  {
    name: 'daily-purge-of-old-messages',
    rule: '0 0 23 * * *', // every day at 23:00
    event: EVENTS.MESSAGE.PURGE_OLD_MESSAGES,
  },
  {
    name: 'daily-cleanup-of-unused-integration-images',
    rule: '0 30 3 * * *', // At 3:30 AM every day
    event: EVENTS.EXTERNAL_INTEGRATION.CLEAN_IMAGES,
  },
  {
    name: 'check-device-batteries',
    rule: '0 0 9 * * 6', // At 09:00 AM, only on Saturday
    event: EVENTS.DEVICE.CHECK_BATTERIES,
  },
  {
    name: 'check-weather-alerts',
    rule: '0 */30 * * * *', // every 30 minutes
    event: EVENTS.WEATHER.CHECK_ALERTS,
  },
  {
    name: 'check-weather-triggers',
    rule: '0 */15 * * * *', // every 15 minutes
    event: EVENTS.WEATHER.CHECK_TRIGGERS,
  },
];

module.exports = jobs;
