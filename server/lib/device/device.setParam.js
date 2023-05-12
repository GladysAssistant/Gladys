const db = require('../../models');

/**
 * @description Create/Update a deviceParam.
 * @param {object} device - The device where the param should be created.
 * @param {string} name - The name of the param.
 * @param {string} value - The value of the param.
 * @example
 * setParam({id: '57aa7f5c-fd6f-410d-81f1-f31e6012fdd9'}, 'BRIDGE_HOST', '192.168.1.1');
 */
async function setParam(device, name, value) {
  let deviceParam = await db.DeviceParam.findOne({
    where: {
      name,
      device_id: device.id,
    },
  });
  // if deviceParam already exist, but value changed, we update it
  if (deviceParam !== null && deviceParam.value !== value) {
    deviceParam.value = value;
    await deviceParam.save();
  } else if (deviceParam === null) {
    // if it doesn't exist we create it
    deviceParam = await db.DeviceParam.create({
      name,
      value,
      device_id: device.id,
    });
  }
}

module.exports = {
  setParam,
};
