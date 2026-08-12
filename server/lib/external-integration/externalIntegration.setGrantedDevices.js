const Promise = require('bluebird');

const db = require('../../models');
const { Error422 } = require('../../utils/httpErrors');
const { WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

/**
 * @description Save the hardware classes granted by the user (complete
 * list, replaces the previous one; requesting is done by the manifest,
 * granting is a user gesture — the effective mount is requested ∩ granted ∩
 * present). The affected sub-containers (the ones requesting hardware) are
 * recreated so the change applies immediately, and the integration is
 * notified through WS (hardware-updated) so it can regenerate its configs
 * and restart what it needs.
 * @param {string} selector - The selector of the external integration.
 * @param {Array} grantedDevices - The granted hardware classes.
 * @returns {Promise<object>} Resolve with the updated integration.
 * @example
 * await gladys.externalIntegration.setGrantedDevices('ext-dev-my-integration', ['coral-usb']);
 */
async function setGrantedDevices(selector, grantedDevices) {
  const service = await this.getBySelector(selector);
  if (!Array.isArray(grantedDevices) || grantedDevices.some((hardwareClass) => typeof hardwareClass !== 'string')) {
    throw new Error422('granted_devices: must be an array of hardware classes');
  }
  const requestedClasses = new Set();
  this.getManifestContainers(service).forEach((entry) => {
    (entry.devices || []).forEach((hardwareClass) => requestedClasses.add(hardwareClass));
  });
  const unknownClasses = grantedDevices.filter((hardwareClass) => !requestedClasses.has(hardwareClass));
  if (unknownClasses.length > 0) {
    throw new Error422(`granted_devices: ${unknownClasses.join(', ')} not requested by the manifest`);
  }
  await db.Service.update({ granted_devices: grantedDevices }, { where: { id: service.id } });
  const updatedService = await this.getBySelector(selector);
  // recreate the sub-containers requesting hardware, keeping their state
  if (this.available) {
    const affectedEntries = this.getManifestContainers(updatedService).filter(
      (entry) => (entry.devices || []).length > 0,
    );
    const desired = await this.getDesiredContainers(updatedService);
    const storedEnvs = await this.getStoredSubContainerEnvs(updatedService);
    await Promise.each(affectedEntries, async (entry) => {
      const existing = await this.findSubContainer(updatedService, entry.name);
      if (!existing) {
        // never created: nothing to recreate
        return;
      }
      const container = await this.createSubContainer(updatedService, entry, {
        env: storedEnvs[entry.name] || {},
      });
      if (desired[entry.name] === 'running') {
        await this.system.restartContainer(container.id);
      }
    });
  }
  const containersState = await this.getSubContainersState(updatedService);
  this.sendMessage(updatedService, WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.HARDWARE_UPDATED, {
    containers: containersState.map(({ name, devices }) => ({ name, devices })),
  });
  return updatedService;
}

module.exports = {
  setGrantedDevices,
};
