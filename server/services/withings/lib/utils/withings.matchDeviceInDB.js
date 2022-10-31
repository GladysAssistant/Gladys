/**
 * @description Returns the gladys device match with withings device.
 *
 * @param {Object} withingsDevice - Withings device to match.
 * @returns {Object} Withings device in DB.
 * @example
 * matchDeviceInDB('rzede-jlkunv-rze23f-csdcs-fsdfsd')
 */
async function matchDeviceInDB(withingsDevice) {
  let matchDevice;
  // get device in db to know device already connected
  const devicesInDB = await this.gladys.device.get({ service: 'withings' });
  if (devicesInDB) {
      matchDevice = devicesInDB.find((element) =>
        element.external_id === withingsDevice.external_id);
  }
  return matchDevice;
}

module.exports = {
  matchDeviceInDB,
};
