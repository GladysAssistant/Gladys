const { getDeviceState } = require('../handlers/getDeviceState');
const logger = require('../../../../utils/logger');

function stateRefreshRequest(requestedDevices) {
  let gladysDevices;
  if (requestedDevices) {
    gladysDevices = requestedDevices.map((requestedDevice) => {
      return this.gladys.stateManager.get('deviceByExternalId', requestedDevice.externalDeviceId);
    });
  } else {
    gladysDevices = Object.values(this.gladys.stateManager.state.device).map((store) => store.get());
  }

  const deviceState = gladysDevices.map((device) => {
      try {
        const states = getDeviceState(device.features);
        return {
          externalDeviceId: device.external_id,
          states,
        };
      } catch (e) {
        logger.warn(`SmartThings device state not detected for ${device.external_id} : ${e}`);
        return undefined;
      }
    })
    .filter((d) => d !== undefined);

  return {
    deviceState,
  };
}

module.exports = {
  stateRefreshRequest,
};
