const Promise = require('bluebird');

const db = require('../../models');
const logger = require('../../utils/logger');

/**
 * @description Silently upsert the params of an already-created device when
 * the integration re-publishes it (same external_id). The params are the
 * technical data OWNED by the integration — a LAN IP renewed by DHCP, a
 * cloud->local switch after a scan — so they are added/updated by name
 * without any user gesture. The name, room and features stay untouched
 * (they belong to the user), nothing is deleted, and no device-updated
 * echo is sent back to the integration (this is its own publication — it
 * would loop).
 * @param {object} createdDevice - The in-memory device (stateManager).
 * @param {Array} publishedParams - The params published in the discovery.
 * @returns {Promise} Resolve when the params are up to date.
 * @example
 * await gladys.externalIntegration.upsertDeviceParams(device, [{ name: 'ip', value: '192.168.1.42' }]);
 */
async function upsertDeviceParams(createdDevice, publishedParams) {
  const existingParams = createdDevice.params || [];
  const changedParams = publishedParams.filter((publishedParam) => {
    if (publishedParam === null || typeof publishedParam !== 'object' || typeof publishedParam.name !== 'string') {
      return false;
    }
    const existing = existingParams.find((existingParam) => existingParam.name === publishedParam.name);
    return !existing || existing.value !== publishedParam.value;
  });
  if (changedParams.length === 0) {
    return;
  }
  logger.debug(`External integration: upserting ${changedParams.length} params of device ${createdDevice.selector}`);
  await Promise.each(changedParams, async (publishedParam) => {
    const existing = existingParams.find((existingParam) => existingParam.name === publishedParam.name);
    if (existing) {
      await db.DeviceParam.update(
        { value: publishedParam.value },
        { where: { device_id: createdDevice.id, name: publishedParam.name } },
      );
      // the in-memory device is the same object across every stateManager
      // key and the poll lists: patching it here updates them all
      existing.value = publishedParam.value;
    } else {
      const created = await db.DeviceParam.create({
        device_id: createdDevice.id,
        name: publishedParam.name,
        value: publishedParam.value,
      });
      existingParams.push({ id: created.id, name: publishedParam.name, value: publishedParam.value });
    }
  });
  createdDevice.params = existingParams;
}

module.exports = {
  upsertDeviceParams,
};
