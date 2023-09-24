const { NotFoundError } = require('../../utils/coreErrors');
const { areObjectsEqual, pick } = require('../../utils/objects');
const db = require('../../models');

const UPDATABLE_FIELDS = ['value'];

/**
 * @description Add a param to a device.
 * @param {string} deviceSelector - The selector of the device.
 * @param {object} param - The new device param.
 * @returns {Promise<object>} Resolve with new device.
 * @example
 * device.addParam('test-device', {
 *    name: 'SENSIBILITY',
 *    value: 100,
 * });
 */
async function addParam(deviceSelector, param) {
  // first, we get the device in the RAM store
  const device = this.stateManager.get('device', deviceSelector);
  // if the device doesn't exist, we throw an error.
  if (device === null) {
    throw new NotFoundError('Device not found');
  }
  // if the device exists, we find the param exist
  const paramIndex = device.params.findIndex((p) => p.name === param.name);
  let paramInStore = device.params[paramIndex];

  // if the param does not already exist, we create it.
  if (paramIndex === -1) {
    const createdParam = await db.DeviceParam.create({ ...param, device_id: device.id });
    paramInStore = createdParam.get({ plain: true });
    device.params.push(paramInStore);
    // we save again the device in RAM
    this.add(device);
  } else if (!areObjectsEqual(paramInStore, param, UPDATABLE_FIELDS)) {
    const paramInDb = await db.DeviceParam.findOne({
      where: { id: paramInStore.id },
    });
    await paramInDb.update(pick(param, UPDATABLE_FIELDS));
    paramInStore = paramInDb.get({ plain: true });
    device.params[paramIndex] = paramInStore;
    // we save again the device in RAM
    this.add(device);
  }

  // we resolve with the device
  return Promise.resolve(device);
}

module.exports = {
  addParam,
};
