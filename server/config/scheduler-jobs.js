const { EVENTS } = require('../utils/constants');

const jobs = [
  {
    name: 'check-gladys-upgrade',
    rule: '0 0 */6 * * *', // every 6 hours
    event: EVENTS.SYSTEM.CHECK_UPGRADE,
  },
  {
    name: 'purge-device-states',
    rule: '0 4 * * * *', // At 4 AM every day
    event: EVENTS.DEVICE.PURGE_STATES,
  },
  {
    name: 'hourly-device-state-aggregate',
    rule: '0 0 * * * *', // every hour
    event: EVENTS.DEVICE.CALCULATE_HOURLY_AGGREGATE,
  },
  {
    name: 'daily-purge-of-old-jobs',
    rule: '0 0 22 * * *', // every day at 22:00
    event: EVENTS.JOB.PURGE_OLD_JOBS,
  },
  {
    name: 'check-device-batteries',
    rule: '0 0 9 * * 6', // At 09:00 AM, only on Saturday
    event: EVENTS.DEVICE.CHECK_BATTERIES,
  },
];

module.exports = jobs;
