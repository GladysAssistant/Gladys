const Promise = require('bluebird');

const db = require('../../models');
const { Error422 } = require('../../utils/httpErrors');
const { WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

/**
 * @description Save the grants of the user: hardware classes and/or Linux
 * capabilities (each one a complete list, replacing the previous one; an
 * omitted list is left unchanged). Requesting is done by the manifest,
 * granting is a user gesture — the effective mount is requested ∩ granted ∩
 * present, the effective CapAdd requested ∩ granted. The affected
 * sub-containers (the ones requesting what changed) are recreated so the
 * change applies immediately, and the integration is notified through WS
 * (hardware-updated) so it can regenerate its configs and restart what it
 * needs.
 * @param {string} selector - The selector of the external integration.
 * @param {object} grants - The grants.
 * @param {Array} [grants.grantedDevices] - The granted hardware classes.
 * @param {Array} [grants.grantedCapabilities] - The granted Linux capabilities.
 * @returns {Promise<object>} Resolve with the updated integration.
 * @example
 * await gladys.externalIntegration.setHardwareGrants('ext-dev-my-integration', { grantedDevices: ['coral-usb'] });
 */
async function setHardwareGrants(selector, { grantedDevices, grantedCapabilities } = {}) {
  const service = await this.getBySelector(selector);
  if (grantedDevices === undefined && grantedCapabilities === undefined) {
    throw new Error422('granted_devices or granted_capabilities is required');
  }
  this.validateHardwareGrants(this.getManifestContainers(service), { grantedDevices, grantedCapabilities });
  await db.Service.update(
    {
      ...(grantedDevices !== undefined ? { granted_devices: grantedDevices } : {}),
      ...(grantedCapabilities !== undefined ? { granted_capabilities: grantedCapabilities } : {}),
    },
    { where: { id: service.id } },
  );
  const updatedService = await this.getBySelector(selector);
  // recreate the sub-containers requesting what changed, keeping their state
  if (this.available) {
    const affectedEntries = this.getManifestContainers(updatedService).filter(
      (entry) =>
        (grantedDevices !== undefined && (entry.devices || []).length > 0) ||
        (grantedCapabilities !== undefined && (entry.capabilities || []).length > 0),
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
    containers: containersState.map(({ name, devices, capabilities }) => ({ name, devices, capabilities })),
  });
  return updatedService;
}

module.exports = {
  setHardwareGrants,
};
