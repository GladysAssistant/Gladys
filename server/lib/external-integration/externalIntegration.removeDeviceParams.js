const db = require('../../models');
const logger = require('../../utils/logger');

/**
 * @description Remove params of an already-created device by name — the
 * counterpart of upsertDeviceParams for the reserved params that carry an
 * "absent = nominal" semantic (e.g. the degraded transport state, cleared
 * by an entry without `degraded`). Same rules as the upsert: technical
 * data owned by the integration, no user gesture, no device-updated echo.
 * @param {object} createdDevice - The in-memory device (stateManager).
 * @param {Array} names - The param names to remove.
 * @returns {Promise} Resolve when the params are removed.
 * @example
 * await gladys.externalIntegration.removeDeviceParams(device, ['GLADYS_TRANSPORT_DEGRADED']);
 */
async function removeDeviceParams(createdDevice, names) {
  const existingParams = createdDevice.params || [];
  const namesToRemove = names.filter((name) => existingParams.some((existingParam) => existingParam.name === name));
  if (namesToRemove.length === 0) {
    return;
  }
  logger.debug(`External integration: removing ${namesToRemove.length} params of device ${createdDevice.selector}`);
  await db.DeviceParam.destroy({ where: { device_id: createdDevice.id, name: namesToRemove } });
  // the in-memory device is the same object across every stateManager
  // key and the poll lists: patching it here updates them all
  createdDevice.params = existingParams.filter((existingParam) => !namesToRemove.includes(existingParam.name));
}

module.exports = {
  removeDeviceParams,
};
