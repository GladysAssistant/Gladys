const Promise = require('bluebird');
const { ACTIONS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../utils/constants');
const { getDeviceFeature } = require('../../utils/device');
const logger = require('../../utils/logger');

const actionsFunc = {
  [ACTIONS.DEVICE.SET_VALUE]: async (self, action, scope) => {
    let device;
    let deviceFeature;
    if (action.device_feature) {
      deviceFeature = self.stateManager.get('deviceFeature', action.device_feature);
      device = self.stateManager.get('deviceById', deviceFeature.device_id);
    } else {
      device = self.stateManager.get('device', action.device);
      deviceFeature = getDeviceFeature(device, action.feature_category, action.feature_type);
    }
    return self.device.setValue(device, deviceFeature, action.value);
  },
  [ACTIONS.LIGHT.TURN_ON]: async (self, action, scope) => {
    await Promise.map(action.devices, async (deviceSelector) => {
      try {
        const device = self.stateManager.get('device', deviceSelector);
        const deviceFeature = getDeviceFeature(
          device,
          DEVICE_FEATURE_CATEGORIES.LIGHT,
          DEVICE_FEATURE_TYPES.LIGHT.BINARY,
        );
        await self.device.setValue(device, deviceFeature, 1);
      } catch (e) {
        logger.warn(e);
      }
    });
  },
  [ACTIONS.TIME.DELAY]: async (self, action, scope) =>
    new Promise((resolve) => {
      let timeToWaitMilliseconds;
      switch (action.unit) {
        case 'milliseconds':
          timeToWaitMilliseconds = action.value;
          break;
        case 'seconds':
          timeToWaitMilliseconds = action.value * 1000;
          break;
        case 'minutes':
          timeToWaitMilliseconds = action.value * 1000 * 60;
          break;
        case 'hours':
          timeToWaitMilliseconds = action.value * 1000 * 60 * 60;
          break;
        default:
          throw new Error(`Unit ${action.unit} not recognized`);
      }
      setTimeout(resolve, timeToWaitMilliseconds);
    }),
  [ACTIONS.SERVICE.START]: async (self, action, scope) => self.stateManager.get('service', action.service).start(),
  [ACTIONS.SERVICE.STOP]: async (self, action, scope) => self.stateManager.get('service', action.service).stop(),
  [ACTIONS.SCENE.START]: async (self, action, scope) => self.execute(action.scene, scope),
  [ACTIONS.MESSAGE.SEND]: async (self, action, scope) => {
    await self.message.sendToUser(action.user, action.text);
  },
};

module.exports = {
  actionsFunc,
};
