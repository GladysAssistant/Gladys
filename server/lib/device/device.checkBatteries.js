const logger = require('../../utils/logger');
const {
  SYSTEM_VARIABLE_NAMES,
  AVAILABLE_LANGUAGES,
  DEVICE_FEATURE_CATEGORIES,
  USER_ROLE,
} = require('../../utils/constants');

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
        const messages = {
          [AVAILABLE_LANGUAGES.EN]: `Warning !!! Battery level on ${device.name} is under ${minPercentBattery}% (current: ${feature.last_value}%)`,
          [AVAILABLE_LANGUAGES.FR]: `Avertissement !!! Le niveau de la batterie de ${device.name} est inférieur à ${minPercentBattery} % (actuel : ${feature.last_value} %)`,
        };
        admins.forEach((admin) => {
          this.messageManager.sendToUser(admin.selector, messages[admin.language]);
        });
      });
  });
}

module.exports = {
  checkBatteries,
};
