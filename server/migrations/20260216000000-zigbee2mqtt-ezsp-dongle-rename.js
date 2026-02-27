const db = require('../models');
const logger = require('../utils/logger');

const EZSP_DONGLE_NAMES = [
  'CoolKit ZB-GW04 USB dongle (a.k.a. easyiot stick)',
  'Elelabs ELU013 and Popp ZB-STICK',
  'Elelabs Zigbee Raspberry Pi Shield/Popp ZB-Shield',
  'Home Assistant SkyConnect (by Nabu Casa)',
  'ITead Sonoff Zigbee 3.0 USB Dongle Plus V2 model "ZBDongle-E"',
  'TubesZB Zigbee EFR32 pro ethernet/USB serial coordinator',
];

module.exports = {
  up: async () => {
    const service = await db.Service.findOne({
      where: { name: 'zigbee2mqtt' },
    });
    if (service === null) {
      return;
    }
    logger.info(`Zigbee2MQTT migration: Found service zigbee2mqtt = ${service.id}`);
    const variable = await db.Variable.findOne({
      where: {
        name: 'ZIGBEE_DONGLE_NAME',
        service_id: service.id,
      },
    });
    if (variable === null) {
      return;
    }
    if (!EZSP_DONGLE_NAMES.includes(variable.value)) {
      return;
    }
    logger.info(`Zigbee2MQTT migration: Renaming EZSP dongle "${variable.value}" to "${variable.value} (legacy ezsp)"`);
    variable.set({ value: `${variable.value} (legacy ezsp)` });
    await variable.save();
  },
  down: async () => {
    const service = await db.Service.findOne({
      where: { name: 'zigbee2mqtt' },
    });
    if (service === null) {
      return;
    }
    const variable = await db.Variable.findOne({
      where: {
        name: 'ZIGBEE_DONGLE_NAME',
        service_id: service.id,
      },
    });
    if (variable === null) {
      return;
    }
    const suffix = ' (legacy ezsp)';
    if (!variable.value || !variable.value.endsWith(suffix)) {
      return;
    }
    const original = variable.value.slice(0, -suffix.length);
    if (!EZSP_DONGLE_NAMES.includes(original)) {
      return;
    }
    variable.set({ value: original });
    await variable.save();
  },
};
