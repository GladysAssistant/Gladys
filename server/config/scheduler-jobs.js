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
    // downsampling of device feature states
    name: 'donwsampling-device-states',
    frequencyInSeconds: 24 * 60 * 60, // Each day to treat states must be downsample
    event: EVENTS.DEVICE.DOWNSAMPLING_STATES,
  },
];

module.exports = jobs;
