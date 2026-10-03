const Promise = require('bluebird');
const logger = require('../../utils/logger');
const { SYSTEM_VARIABLE_NAMES, DEVICE_FEATURE_CATEGORIES, USER_ROLE } = require('../../utils/constants');
const { isSystemVariableEnabled } = require('../../utils/systemVariable');

/**
 * @description Check battery level and warn if needed.
 * @returns {Promise} Resolve when finished.
 * @example
 * device.purgeStates();
 */
async function checkBatteries() {
  const enabled = await this.variable.getValue(SYSTEM_VARIABLE_NAMES.DEVICE_BATTERY_LEVEL_WARNING_ENABLED);
  // variables are stored as text: once disabled, the value is '0', which is truthy
  if (!isSystemVariableEnabled(enabled)) {
    return;
  }
  logger.debug('Checking batteries ...');

  const minPercentBattery = await this.variable.getValue(SYSTEM_VARIABLE_NAMES.DEVICE_BATTERY_LEVEL_WARNING_THRESHOLD);

  const admins = await this.user.getByRole(USER_ROLE.ADMIN);

  if (!minPercentBattery || !admins || admins.length === 0) {
    return;
  }

  // Handle battery features
  const devices = await this.get({ device_feature_category: DEVICE_FEATURE_CATEGORIES.BATTERY });

  await Promise.each(devices, async (device) => {
    const lowBatteryFeatures = device.features.filter((feature) => {
      // We only take device with battery level < threshold
      return feature.last_value !== null && feature.last_value < minPercentBattery;
    });
    await Promise.each(lowBatteryFeatures, async (feature) => {
      await Promise.each(admins, async (admin) => {
        const message = this.brain.getReply(admin.language, 'battery-threshold.success', {
          device: {
            name: device.name,
          },
          value: {
            min: minPercentBattery,
            current: feature.last_value,
          },
        });
        // one failing admin must not prevent the others from being warned
        try {
          await this.messageManager.sendToUser(admin.selector, message, null, { messageType: 'notification' });
        } catch (e) {
          logger.error(`Unable to send the battery warning of device ${device.name} to ${admin.selector}`, e);
        }
      });
    });
  });

  const devicesWithBatteryLowFeatures = await this.get({
    device_feature_category: DEVICE_FEATURE_CATEGORIES.BATTERY_LOW,
  });

  await Promise.each(devicesWithBatteryLowFeatures, async (device) => {
    const batteryLowFeatures = device.features.filter((feature) => {
      // We only take devices with battery low === true
      return feature.last_value === 1;
    });
    await Promise.each(batteryLowFeatures, async () => {
      await Promise.each(admins, async (admin) => {
        const message = this.brain.getReply(admin.language, 'battery-level-is-low.success', {
          device: {
            name: device.name,
          },
        });
        // one failing admin must not prevent the others from being warned
        try {
          await this.messageManager.sendToUser(admin.selector, message, null, { messageType: 'notification' });
        } catch (e) {
          logger.error(`Unable to send the battery warning of device ${device.name} to ${admin.selector}`, e);
        }
      });
    });
  });
}

module.exports = {
  checkBatteries,
};
