const { addSelector } = require('../../../../utils/addSelector');
const { setDeviceParam } = require('../../../../utils/setDeviceParam');

const { PARAMS } = require('../utils/bluetooth.constants');
const { encodeParamValue } = require('./bluetooth.information');

/**
 * @description Transform Noble peripheral to Gladys Bluetooth peripheral.
 * @param {Object} peripheral - Bluetooth peripheral.
 * @returns {Object} Peripheral transformed for Gladys.
 * @example
 * transformToDevice({});
 */
function transformToDevice(peripheral) {
  const { uuid, address, advertisement = {}, connectable } = peripheral;
  const { localName, manufacturerData } = advertisement;
  const externalId = `bluetooth:${uuid}`;

  const device = {
    name: encodeParamValue(localName) || address || uuid,
    external_id: externalId,
    selector: externalId,
    features: [],
    params: [],
  };

  if (!connectable) {
    setDeviceParam(device, PARAMS.LOADED, true);
  }

  if (manufacturerData) {
    setDeviceParam(device, PARAMS.MANUFACTURER_DATA, manufacturerData.toString('hex'));
  }

  addSelector(device);

  return device;
}

module.exports = {
  transformToDevice,
};
