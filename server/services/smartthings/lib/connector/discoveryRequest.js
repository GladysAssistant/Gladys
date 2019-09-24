const { getDeviceHandler } = require('../handlers/getDeviceHandler');
const logger = require('../../../../utils/logger');

function discoveryRequest() {
  const gladysDevices = this.gladys.stateManager.state.device;

  const devices = Object.values(gladysDevices)
    .map((store) => {
      const device = store.get();
      try {
        const deviceHandlerType = getDeviceHandler(device.features);
        return {
          externalDeviceId: device.external_id,
          friendlyName: device.name,
          deviceHandlerType: deviceHandlerType.value,
          manufacturerInfo: {
            manufacturerName: "LIFX",
            modelName: "Outlet",
          },
        };
      } catch (e) {
        logger.warn(`SmartThings device handler type not detected for ${device.external_id} : ${e}`);
        return undefined;
      }
    })
    .filter((d) => d !== undefined);

  return {
    devices,
  };
}

module.exports = {
  discoveryRequest,
};
