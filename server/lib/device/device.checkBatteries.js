const logger = require('../../utils/logger');
const { SYSTEM_VARIABLE_NAMES, DEVICE_FEATURE_CATEGORIES, USER_ROLE } = require('../../utils/constants');

/**
 * @description Check battery level and warn if needed.
 * @returns {Promise} Resolve when finished.
 * @example
 * device.purgeStates();
 */
async function checkBatteries() {
  const enabled = await this.variable.getValue(SYSTEM_VARIABLE_NAMES.DEVICE_BATTERY_LEVEL_WARNING_ENABLED);
  if (!enabled) {
    return;
  }
  logger.debug('Checking batteries ...');

  const minPercentBattery = await this.variable.getValue(SYSTEM_VARIABLE_NAMES.DEVICE_BATTERY_LEVEL_WARNING_THRESHOLD);

  const admins = await this.user.getByRole(USER_ROLE.ADMIN);

  if (!minPercentBattery || !admins || admins.length === 0) {
    return;
  }

  const devices = await this.get({ device_feature_category: DEVICE_FEATURE_CATEGORIES.BATTERY });

  devices.forEach((device) => {
    device.features
      .filter((feature) => {
        return feature.last_value < minPercentBattery;
      })
      .forEach((feature) => {
        admins.forEach((admin) => {
          const message = this.brain.getReply(admin.language, 'battery-threshold.success', {
            device: {
              name: device.name,
            },
            value: {
              min: minPercentBattery,
              current: feature.last_value,
            },
          });
          this.messageManager.sendToUser(admin.selector, message);
        });
      });
  });
}

module.exports = {
  checkBatteries,
};
