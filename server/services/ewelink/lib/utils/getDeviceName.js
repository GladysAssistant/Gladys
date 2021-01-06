const { titleize } = require('../../../../utils/titleize');

/**
 * @description Get the device name, if exist or create one.
 * @param {Object} device - The eWeLink device.
 * @param {number} channel - The channel of the device to control.
 * @returns {string} Return the name of the device.
 * @example
 * getDeviceName(device);
 */
function getDeviceName(device, channel = 0) {
  const name =
    device.name !== ''
      ? device.name.concat(channel > 0 ? ` CH${channel}` : '')
      : ''.concat(
          device.brandName && device.brandName.length > 0 ? ` ${device.brandName}` : '',
          device.productModel && device.productModel.length > 0 ? ` ${device.productModel}` : '',
          channel > 0 ? ` CH${channel}` : '',
        );
  return titleize(name.trim());
}

module.exports = {
  getDeviceName,
};
