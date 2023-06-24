const { EVENTS } = require('../../../utils/constants');
const logger = require('../../../utils/logger');
const { MODEL, PROPERTY } = require('./sunspec.constants');
const { getDeviceFeatureExternalId } = require('./utils/sunspec.externalId');
const { ModelFactory } = require('./utils/sunspec.ModelFactory');

/**
 * @description Scan SunSpec devices.
 * @example
 * sunspec.scanDevices();
 */
async function scanDevices() {
  logger.debug(`SunSpec: Scanning devices...`);

  // @ts-ignore
  const { mppt } = ModelFactory.createModel(await this.modbus.readModel(MODEL.MPPT_INVERTER_EXTENSION));
  this.devices.forEach((device) => {
    const { DCA, DCV, DCW, DCWH } = mppt[device.mppt - 1];

    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: getDeviceFeatureExternalId({
        ...device,
        property: PROPERTY.DCA,
      }),
      state: DCA,
    });
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: getDeviceFeatureExternalId({
        ...device,
        property: PROPERTY.DCV,
      }),
      state: DCV,
    });
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: getDeviceFeatureExternalId({
        ...device,
        property: PROPERTY.DCW,
      }),
      state: DCW,
    });
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: getDeviceFeatureExternalId({
        ...device,
        property: PROPERTY.DCWH,
      }),
      state: DCWH,
    });

    logger.debug(`SunSpec: Scanning device done`);
  });
}

module.exports = {
  scanDevices,
};
