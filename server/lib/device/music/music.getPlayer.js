const get = require('get-value');
const { NotFoundError, BadParameters } = require('../../../utils/coreErrors');

/**
 * @description Resolve a player and the music capability of its integration:
 * the device must exist and belong to a service exposing `music` — an
 * external device integration (capabilities/music.md, section 4.3). A frozen
 * internal service's player, or any other device, is `404 MUSIC_NOT_SUPPORTED`.
 * @param {string} selector - The device selector.
 * @returns {object} The device and the `music` capability of its service.
 * @example
 * const { device, music } = this.getPlayer('kitchen-speaker');
 */
function getPlayer(selector) {
  const device = this.stateManager.get('device', selector);
  if (device === null) {
    throw new NotFoundError('Device not found');
  }
  const service = this.serviceManager.getService(get(device, 'service.name'));
  if (!service || !service.music) {
    throw new NotFoundError('MUSIC_NOT_SUPPORTED');
  }
  return { device, music: service.music };
}

/**
 * @description Parse a bounded integer parameter (a query string value or a
 * number), `400` outside its bounds, the fallback when absent.
 * @param {any} value - The raw value.
 * @param {object} bounds - The parameter name and bounds.
 * @param {string} bounds.name - The parameter name, for the error.
 * @param {number} bounds.min - The minimum (inclusive).
 * @param {number} [bounds.max] - The maximum (inclusive).
 * @param {number} [bounds.fallback] - The value when absent.
 * @returns {number} The parsed integer.
 * @example
 * parseBoundedInteger('50', { name: 'limit', min: 1, max: 100, fallback: 50 });
 */
function parseBoundedInteger(value, { name, min, max, fallback }) {
  if (value === undefined || value === null || value === '') {
    if (fallback === undefined) {
      throw new BadParameters(`${name}: required`);
    }
    return fallback;
  }
  const parsed = typeof value === 'number' ? value : Number(String(value));
  if (!Number.isInteger(parsed) || parsed < min || (max !== undefined && parsed > max)) {
    throw new BadParameters(`${name}: must be an integer between ${min} and ${max === undefined ? 'infinity' : max}`);
  }
  return parsed;
}

module.exports = {
  getPlayer,
  parseBoundedInteger,
};
