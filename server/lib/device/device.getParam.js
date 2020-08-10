const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Get a deviceParam
 * @param {Object} device - The device where the param should be retrieved.
 * @param {string} name - The name of the param.
 * @example
 * setParam({id: '57aa7f5c-fd6f-410d-81f1-f31e6012fdd9'}, 'BRIDGE_HOST');
 */
async function getParam(device, name) {
  const deviceParam = await db.DeviceParam.findOne({
    where: {
      name,
      device_id: device.id,
    },
  });
  if (deviceParam === null) {
    throw new NotFoundError('Device not found');
  }
  return deviceParam.get({ plain: true });
}

module.exports = {
  getParam,
};
