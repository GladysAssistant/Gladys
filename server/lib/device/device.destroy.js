const { NotFoundError } = require('../../utils/coreErrors');
const db = require('../../models');

/**
 * @description Destroy a device.
 * @param {string} selector - Device selector.
 * @example
 * device.destroy('test-device');
 */
async function destroy(selector) {
  const device = await db.Device.findOne({
    where: {
      selector,
    },
  });

  if (device === null) {
    throw new NotFoundError('Device not found');
  }

  await device.destroy();
}

module.exports = {
  destroy,
};
