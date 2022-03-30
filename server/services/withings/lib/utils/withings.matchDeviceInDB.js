const withingsDeviceIdName = 'WITHINGS_DEVICE_ID';

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
    const currentDeviceParam = withingsDevice.params.filter((element) => element.name === withingsDeviceIdName);
    if (currentDeviceParam && currentDeviceParam.length > 0) {
      const currentWithingsDeviceId = currentDeviceParam[0].value;

      matchDevice = devicesInDB.find((element) =>
        element.params.find((param) => param.name === withingsDeviceIdName && param.value === currentWithingsDeviceId),
      );
    }
  }
  return matchDevice;
}

module.exports = {
  matchDeviceInDB,
};
