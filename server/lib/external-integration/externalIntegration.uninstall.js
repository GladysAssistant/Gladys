const Promise = require('bluebird');
const fs = require('fs');

const db = require('../../models');
const logger = require('../../utils/logger');

/**
 * @description Uninstall an external integration. Removes everything:
 * container, sub-containers and their private network, data folder,
 * devices, config variables, then the t_service row. There is no
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
  try {
    await this.removeSubContainers(service);
  } catch (e) {
    logger.warn(`Unable to remove sub-containers of integration ${selector}`, e);
  }
  // the data folder goes too (sub-container volumes, /data of the main
  // container): uninstall leaves nothing behind
  try {
    const { basePathOnContainer } = await this.system.getGladysBasePath();
    await fs.promises.rm(`${basePathOnContainer}/external-integrations/${service.selector}`, {
      recursive: true,
      force: true,
    });
  } catch (e) {
    logger.warn(`Unable to remove data folder of integration ${selector}`, e);
  }
  const devices = await db.Device.findAll({ where: { service_id: service.id } });
  await Promise.each(devices, (device) => this.device.destroy(device.selector));
  await db.Variable.destroy({ where: { service_id: service.id } });
  await db.Service.destroy({ where: { id: service.id } });
  this.stateManager.deleteState('service', service.name);
  this.stateManager.deleteState('serviceById', service.id);
  this.discoveredDevices.delete(service.id);
  this.startedAt.delete(service.id);
  this.stateRateLimits.delete(service.id);
}

module.exports = {
  uninstall,
};
