const { BadParameters } = require('../../utils/coreErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { TRANSPORT_PARAM, DEVICE_TRANSPORTS, MAX_TRANSPORTS_PER_REQUEST } = require('./constants');

/**
 * @description Update the GLADYS_TRANSPORT param of a batch of devices
 * without re-publishing the whole discovered list — the lightweight path
 * for hot transport flips (the cloud link drops -> unreachable, the LAN
 * comes back -> local). The devices badges of the UI update in real time
 * through the device-transport-updated push. An unknown (or foreign)
 * device_external_id is silently ignored; the transport report is purely
 * declarative — zero routing semantics in the core.
 * @param {object} service - The external integration service.
 * @param {Array} transports - The batch: [{ device_external_id, transport }].
 * @returns {Promise<object>} Resolve with { success: true }.
 * @example
 * await gladys.externalIntegration.setDeviceTransports(service, [
 *   { device_external_id: 'ext:tuya-demo:plug1', transport: 'local' },
 * ]);
 */
async function setDeviceTransports(service, transports) {
  if (!Array.isArray(transports) || transports.length === 0 || transports.length > MAX_TRANSPORTS_PER_REQUEST) {
    throw new BadParameters(`transports: must be a list of 1-${MAX_TRANSPORTS_PER_REQUEST} entries`);
  }
  transports.forEach((entry, index) => {
    if (entry === null || typeof entry !== 'object') {
      throw new BadParameters(`transports[${index}]: must be an object`);
    }
    if (typeof entry.device_external_id !== 'string' || entry.device_external_id.length === 0) {
      throw new BadParameters(`transports[${index}].device_external_id: must be a non-empty string`);
    }
    if (!DEVICE_TRANSPORTS.includes(entry.transport)) {
      throw new BadParameters(`transports[${index}].transport: must be one of ${DEVICE_TRANSPORTS.join(', ')}`);
    }
  });
  const applied = [];
  // sequential on purpose: the batch is small and the upserts hit the DB
  // eslint-disable-next-line no-restricted-syntax
  for (const entry of transports) {
    const device = this.stateManager.get('deviceByExternalId', entry.device_external_id);
    if (device !== null && device.service_id === service.id) {
      // eslint-disable-next-line no-await-in-loop
      await this.upsertDeviceParams(device, [{ name: TRANSPORT_PARAM, value: entry.transport }]);
      applied.push({ device_external_id: entry.device_external_id, transport: entry.transport });
    }
  }
  if (applied.length > 0) {
    this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_TRANSPORT_UPDATED,
      payload: { selector: service.selector, transports: applied },
    });
  }
  return { success: true };
}

module.exports = {
  setDeviceTransports,
};
