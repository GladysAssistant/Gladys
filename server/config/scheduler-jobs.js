const { EVENTS } = require('../utils/constants');

const jobs = [
  {
    name: 'check-gladys-upgrade',
    rule: '0 0 */6 * * *', // every 6 hours
    event: EVENTS.SYSTEM.CHECK_UPGRADE,
  },
  {
    name: 'purge-device-states',
    rule: '0 30 */4 * * *', // every 4 hours
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
];

module.exports = jobs;
