const { Hub } = require('node-xiaomi-smart-home');
const logger = require('../../../utils/logger');

/**
 * @param {Object} gladys - The gladys object.
 * @param {string} serviceId - Identification of the service.
 * @description Create all device if not exist by listening
 * @example
 * hubDiscover(gladys, serviceId)
 */
async function hubDiscover(gladys, serviceId) {
  // eslint-disable-next-line vars-on-top
  const xiaomi = new Hub();

  xiaomi.listen();

  // eslint-disable-next-line func-names
  xiaomi.on('error', function(e) {
    // eslint-disable-next-line no-console
    logger.debug(`${e}`);
  });

  // eslint-disable-next-line func-names
  await xiaomi.on('data.weather', async function(sid, temperature, humidity, pressure, battery) {
    try {
      gladys.device.create({
        service_id: serviceId,
        name: `xiaomi-${sid}-temperature`,
        external_id: `xiaomi:${sid}`,
        should_poll: false,
        features: [
          {
            name: `xiaomi-${sid}-temperature`,
            external_id: `xiaomitemperature:${sid}:decimal:temperature`,
            category: 'temperature-sensor',
            type: 'decimal',
            unit: 'celsius',
            read_only: true,
            keep_history: true,
            has_feedback: false,
            min: -20,
            max: 100,
          },
          {
            name: `xiaomi-${sid}-humidity`,
            external_id: `xiaomihumidity:${sid}:decimal`,
            category: 'humidity-sensor',
            type: 'decimal',
            unit: 'percent',
            read_only: true,
            keep_history: true,
            has_feedback: false,
            min: 0,
            max: 100,
          },
        ],
      });
      const device = await gladys.device.get({ search: sid });
      gladys.device.saveState({ id: device[0].features[0].id, selector: 'my-magnet' }, temperature);
      gladys.device.saveState({ id: device[0].features[1].id, selector: 'my-magnet' }, humidity);
    } catch (e) {
      logger.debug(`${e}`);
    }
  });
}

module.exports = {
  hubDiscover,
};
