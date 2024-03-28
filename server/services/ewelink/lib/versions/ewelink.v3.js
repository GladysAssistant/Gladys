const Promise = require('bluebird');
const logger = require('../../../../utils/logger');

/**
 * @description Upgrades integration to v3.
 * @param {object} ewelink - Current eWeLink service handler.
 * @example
 * await v3.apply();
 */
async function apply(ewelink) {
  logger.info('eWeLink: load existing devices...');

  // Load eWeLink devices
  const { serviceId, gladys } = ewelink;
  const devices = gladys.device.get({ service_id: serviceId });

  await Promise.each(devices, async (device) => {
    const { params, external_id: externalId } = device;
    // Update params
    logger.info('eWeLink: unset IP_ADDRESS and FIRMWARE="?.?.?" parameters from "%s" device...', externalId);
    // - remove 'IP_ADDRESS' param
    // - remove 'FIRMWARE' with '?.?.?' value
    const clearedParams = params.filter((param) => {
      return !(param.name === 'IP_ADDRESS' || (param.name === 'FIRMWARE' && param.value === '?.?.?'));
    });
    device.params = clearedParams;

    // Remove poll information
    logger.info('eWeLink: unset polling from "%s" device...', externalId);
    device.should_poll = false;
    delete device.poll_frequency;

    // Save device
    logger.info('eWeLink: saving cleared "%s" device...', externalId);
    await gladys.device.create(device);
  });
}

module.exports = {
  apply,
  VERSION_NUMBER: 3,
};
