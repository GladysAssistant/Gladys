const db = require('../models');
const logger = require('../utils/logger');

const MIN_PARAM = 'THERMOSTAT_MIN_TEMP';
const MAX_PARAM = 'THERMOSTAT_MAX_TEMP';
// The range Matter advertises on every heating setpoint, whatever the appliance.
const MATTER_MIN = -100;
const MATTER_MAX = 200;

// The edit form used to replace a range left at its defaults with the range of
// the setpoint feature picked, wider or not (spec docs/specs/thermostat.md F).
// Matter advertises the cluster's -100-200 °C on every thermostat, so an
// external thermostat created on one without opening the folded range section
// was saved with THERMOSTAT_MIN_TEMP=-100 / _MAX_TEMP=200, and its dial spans
// that. Nobody typed that pair: it is dropped, and the thermostat takes the
// shared default range, in its own unit. Any other range is the user's and is
// left alone, as is a thermostat carrying only one of the two values.
module.exports = {
  up: async () => {
    const service = await db.Service.findOne({
      attributes: ['id'],
      where: {
        name: 'thermostat',
      },
    });
    if (service === null) {
      logger.info('Thermostat Matter range migration: thermostat service not found, nothing to do.');
      return;
    }
    const devices = await db.Device.findAll({
      attributes: ['id'],
      where: {
        service_id: service.id,
      },
    });
    const params = await db.DeviceParam.findAll({
      attributes: ['id', 'device_id', 'name', 'value'],
      where: {
        device_id: devices.map((device) => device.id),
        name: [MIN_PARAM, MAX_PARAM],
      },
    });
    const carries = (deviceId, name, value) =>
      params.some((param) => param.device_id === deviceId && param.name === name && Number(param.value) === value);
    const toDrop = devices
      .filter((device) => carries(device.id, MIN_PARAM, MATTER_MIN) && carries(device.id, MAX_PARAM, MATTER_MAX))
      .map((device) => device.id);
    if (toDrop.length === 0) {
      logger.info('Thermostat Matter range migration: no thermostat carries the Matter range, nothing to do.');
      return;
    }
    await db.DeviceParam.destroy({
      where: {
        device_id: toDrop,
        name: [MIN_PARAM, MAX_PARAM],
      },
    });
    logger.info(`Thermostat Matter range migration: ${toDrop.length} thermostat(s) back on the default range.`);
  },
  down: async () => {},
};
