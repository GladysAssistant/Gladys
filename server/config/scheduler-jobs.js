const { EVENTS } = require('../utils/constants');

const jobs = [
  {
    name: 'backup-gateway',
    frequencyInSeconds: 24 * 60 * 60,
    event: EVENTS.GATEWAY.CREATE_BACKUP,
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
];

module.exports = jobs;
