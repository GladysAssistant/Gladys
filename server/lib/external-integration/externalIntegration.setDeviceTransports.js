const { BadParameters } = require('../../utils/coreErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const {
  TRANSPORT_PARAM,
  TRANSPORT_DEGRADED_PARAM,
  TRANSPORT_MESSAGE_PARAM,
  MAX_TRANSPORT_MESSAGE_LENGTH,
  DEVICE_TRANSPORTS,
  MAX_TRANSPORTS_PER_REQUEST,
} = require('./constants');

/**
 * @description Validate the multi-language reason of a degraded transport
 * state ({ en: '...', fr: '...' }, en required, 200 chars max per language).
 * @param {object} message - The multi-language message.
 * @param {string} path - The path of the field, for error messages.
 * @example
 * validateTransportMessage({ en: 'Local session refused' }, 'transports[0].message');
 */
function validateTransportMessage(message, path) {
  if (message === null || typeof message !== 'object' || Array.isArray(message)) {
    throw new BadParameters(`${path}: must be an object mapping language codes to strings`);
  }
  if (typeof message.en !== 'string' || message.en.length === 0) {
    throw new BadParameters(`${path}.en: english translation is required`);
  }
  Object.keys(message).forEach((language) => {
    const text = message[language];
    if (typeof text !== 'string' || text.length === 0 || text.length > MAX_TRANSPORT_MESSAGE_LENGTH) {
      throw new BadParameters(`${path}.${language}: must be a string of 1-${MAX_TRANSPORT_MESSAGE_LENGTH} characters`);
    }
  });
}

/**
 * @description Update the GLADYS_TRANSPORT* params of a batch of devices
 * without re-publishing the whole discovered list — the lightweight path
 * for hot transport flips (the cloud link drops -> unreachable, the LAN
 * comes back -> local). An entry can also carry the degraded state
 * (`degraded` + optional multi-language `message`), orthogonal to the
 * transport value: "cloud + degraded" means the device works through its
 * fallback, not its nominal mode. An entry without `degraded` CLEARS the
 * degraded params (explicit return to nominal, no phantom orange state).
 * The devices badges of the UI update in real time through the
 * device-transport-updated push. An unknown (or foreign)
 * device_external_id is silently ignored; the transport report is purely
 * declarative — zero routing semantics in the core.
 * @param {object} service - The external integration service.
 * @param {Array} transports - The batch: [{ device_external_id, transport, degraded, message }].
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
    if (entry.degraded !== undefined && typeof entry.degraded !== 'boolean') {
      throw new BadParameters(`transports[${index}].degraded: must be a boolean`);
    }
    // the message is only taken into account on a degraded entry
    if (entry.degraded === true && entry.message !== undefined) {
      validateTransportMessage(entry.message, `transports[${index}].message`);
    }
  });
  const applied = [];
  // sequential on purpose: the batch is small and the upserts hit the DB
  // eslint-disable-next-line no-restricted-syntax
  for (const entry of transports) {
    const device = this.stateManager.get('deviceByExternalId', entry.device_external_id);
    if (device !== null && device.service_id === service.id) {
      const degraded = entry.degraded === true;
      const message = degraded && entry.message !== undefined ? entry.message : null;
      const paramsToUpsert = [{ name: TRANSPORT_PARAM, value: entry.transport }];
      if (degraded) {
        paramsToUpsert.push({ name: TRANSPORT_DEGRADED_PARAM, value: 'true' });
        if (message) {
          paramsToUpsert.push({ name: TRANSPORT_MESSAGE_PARAM, value: JSON.stringify(message) });
        }
      }
      // eslint-disable-next-line no-await-in-loop
      await this.upsertDeviceParams(device, paramsToUpsert);
      // absent = nominal: a non-degraded entry clears both degraded
      // params, a degraded entry without message clears any stale reason
      const paramsToRemove = degraded
        ? [...(message ? [] : [TRANSPORT_MESSAGE_PARAM])]
        : [TRANSPORT_DEGRADED_PARAM, TRANSPORT_MESSAGE_PARAM];
      if (paramsToRemove.length > 0) {
        // eslint-disable-next-line no-await-in-loop
        await this.removeDeviceParams(device, paramsToRemove);
      }
      applied.push({ device_external_id: entry.device_external_id, transport: entry.transport, degraded, message });
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
  validateTransportMessage,
};
