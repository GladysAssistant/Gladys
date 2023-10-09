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

  Object.values(this.devices)
    .filter((device) => device.mppt === undefined)
    .forEach(async (device) => {
      const values = ModelFactory.createModel(await device.modbus.readModel(device.valueModel));
      Object.entries(values).forEach(async (entry) => {
        const [name, value] = entry;
        const externalId = getDeviceFeatureExternalId({
          ...device,
          property: name,
        });
        if (this.stateManager.get('deviceFeatureByExternalId', externalId)) {
          this.eventManager.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: externalId,
            state: value,
          });
        }
      }, this);
    }, this);

  Object.values(this.devices)
    .filter((device) => device.mppt !== undefined)
    .forEach(async (device) => {
      // @ts-ignore
      const { mppt } = ModelFactory.createModel(await device.modbus.readModel(MODEL.MPPT_INVERTER_EXTENSION));
      const { DCA, DCV, DCW, DCWH } = mppt[device.mppt - 1];

      let externalId = getDeviceFeatureExternalId({
        ...device,
        property: PROPERTY.DCA,
      });
      if (this.stateManager.get('deviceFeatureByExternalId', externalId)) {
        this.eventManager.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: externalId,
          state: DCA,
        });
      }
      externalId = getDeviceFeatureExternalId({
        ...device,
        property: PROPERTY.DCV,
      });
      if (this.stateManager.get('deviceFeatureByExternalId', externalId)) {
        this.eventManager.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: externalId,
          state: DCV,
        });
      }
      externalId = getDeviceFeatureExternalId({
        ...device,
        property: PROPERTY.DCW,
      });
      if (this.stateManager.get('deviceFeatureByExternalId', externalId)) {
        this.eventManager.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: externalId,
          state: DCW,
        });
      }
      externalId = getDeviceFeatureExternalId({
        ...device,
        property: PROPERTY.DCWH,
      });
      if (this.stateManager.get('deviceFeatureByExternalId', externalId)) {
        this.eventManager.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: externalId,
          state: DCWH,
        });
      }
    }, this);

  logger.debug(`SunSpec: Scanning devices done`);
}

module.exports = {
  scanDevices,
};
