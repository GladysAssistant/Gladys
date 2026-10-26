const { hasServiceLabel } = require('../../../utils/dockerContainers');

/**
 * @description Tell whether an embedded broker container was configured by Gladys.
 * The Mosquitto version is stored as soon as Gladys configures its broker
 * (`installContainer` saves the configuration, `updateContainer` stores it too),
 * so a container created before the label existed, from the public image, with
 * no stored version, is a broker Gladys never configured: a user one carrying
 * our name, which is never reconfigured nor replaced.
 * @param {object} container - Container summary, as returned by `system.getContainers`.
 * @param {string|null} mosquittoVersion - The stored Mosquitto version, if any.
 * @returns {boolean} True when the broker is ours.
 * @example
 * if (!isBrokerConfiguredByGladys(container, mosquittoVersion)) { ... }
 */
function isBrokerConfiguredByGladys(container, mosquittoVersion) {
  return hasServiceLabel(container) || Boolean(mosquittoVersion);
}

module.exports = {
  isBrokerConfiguredByGladys,
};
