const { EVENTS } = require('../utils/constants');

const jobs = [
  {
    name: 'backup-gateway',
    frequencyInSeconds: 2 * 60 * 60, // we check every 2 hour if needed, but it will backup only once a day
    event: EVENTS.GATEWAY.CHECK_IF_BACKUP_NEEDED,
  },
  {
    name: 'check-gladys-upgrade',
    frequencyInSeconds: 6 * 60 * 60,
    event: EVENTS.SYSTEM.CHECK_UPGRADE,
  },
  {
    name: 'purge-device-states',
    frequencyInSeconds: 4 * 60 * 60,
    event: EVENTS.DEVICE.PURGE_STATES,
  },
  {
    name: 'hourly-device-state-aggregate',
    frequencyInSeconds: 60 * 60,
    event: EVENTS.DEVICE.CALCULATE_HOURLY_AGGREGATE,
  },
  {
    name: 'daily-purge-of-old-jobs',
    frequencyInSeconds: 24 * 60 * 60,
    event: EVENTS.JOB.PURGE_OLD_JOBS,
  },
];

module.exports = jobs;
