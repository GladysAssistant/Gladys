const Promise = require('bluebird');

const db = require('../../models');
const logger = require('../../utils/logger');

/**
 * @description Uninstall an external integration. Removes everything:
 * container, devices, config variables, then the t_service row. There is no
 * "keep the devices" option: t_device.service_id is a mandatory FK and
 * orphan devices don't exist in the model — the user gets everything back
 * through Discovery on reinstall.
 * @param {string} selector - The selector of the external integration.
 * @returns {Promise} Resolve when the integration is fully removed.
 * @example
 * await gladys.externalIntegration.uninstall('ext-dev-my-integration');
 */
async function uninstall(selector) {
  const service = await this.getBySelector(selector);
  this.clearTimers(service.id);
  const connection = this.connections.get(service.id);
  if (connection) {
    try {
      connection.terminate();
    } catch (e) {
      logger.debug(e);
    }
    this.connections.delete(service.id);
  }
  if (service.container_id) {
    try {
      await this.system.removeContainer(service.container_id, { force: true });
    } catch (e) {
      logger.warn(`Unable to remove container of integration ${selector}`, e);
    }
  }
  const devices = await db.Device.findAll({ where: { service_id: service.id } });
  await Promise.each(devices, (device) => this.device.destroy(device.selector));
  await db.Variable.destroy({ where: { service_id: service.id } });
  await db.Service.destroy({ where: { id: service.id } });
  this.stateManager.deleteState('service', service.name);
  this.stateManager.deleteState('serviceById', service.id);
  this.discoveredDevices.delete(service.id);
  this.connectionStatuses.delete(service.id);
  this.startedAt.delete(service.id);
  this.stateRateLimits.delete(service.id);
}

module.exports = {
  uninstall,
};
