const { EVENTS } = require('../../../utils/constants');
const logger = require('../../../utils/logger');
const { MODEL, PROPERTY, DEFAULT } = require('./sunspec.constants');
const { getDeviceFeatureExternalId } = require('./utils/sunspec.externalId');
const { ModelFactory } = require('./utils/sunspec.ModelFactory');

/**
 * @description Scan SunSpec devices.
 * @example
 * sunspec.scanDevices();
 */
async function scanDevices() {
  logger.debug(`SunSpec : Scanning devices...`);

  this.scanInterval = setInterval(async () => {
    const { S1_DCA, S1_DCV, S1_DCW, S1_DCWH, S2_DCA, S2_DCV, S2_DCW, S2_DCWH } = ModelFactory.createModel(
      await this.modbus.readModel(MODEL.MPPT_INVERTER_EXTENSION),
    );
    this.devices.forEach((device) => {
      let DCA;
      let DCV;
      let DCW;
      let DCWH;
      if (device.mppt === 1) {
        DCA = S1_DCA;
        DCV = S1_DCV;
        DCW = S1_DCW;
        DCWH = S1_DCWH;
      } else if (device.mppt === 2) {
        DCA = S2_DCA;
        DCV = S2_DCV;
        DCW = S2_DCW;
        DCWH = S2_DCWH;
      } else {
        return;
      }

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
    });
  }, DEFAULT.SCAN_DEVICE_TIMEOUT);
}

module.exports = {
  scanDevices,
};
