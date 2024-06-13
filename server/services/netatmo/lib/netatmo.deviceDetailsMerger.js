/**
 * @description Discover Netatmo cloud devices.
 * @param {object} listDevices - List of devices discovered.
 * @param {object} devices - List of devices with dedicated API discovered.
 * @param {object} modules - List of modules with dedicated API discovered.
 * @param {string} SUPPORTED_MODULE_TYPE - Plug Module type NAPlug/NAMain/NACamera.
 * @returns {Promise} List of devices update.
 * @example
 * await mergeDeviceDetails(listDevices, devices, modules, SUPPORTED_MODULE_TYPE.PLUG);
 */
async function mergeDeviceDetails(listDevices, devices, modules, SUPPORTED_MODULE_TYPE) {
  let updatedListDevices = listDevices;
  if (updatedListDevices.length > 0) {
    /* we add the properties of the API request to those of the previous API request */
    const listDeviceIds = updatedListDevices.map((device) => device._id || device.id);
    updatedListDevices = listDeviceIds.map((id) => {
      let deviceList = updatedListDevices.find((device) => device._id === id || device.id === id);
      const matchedDevice = devices.find((d) => d._id === id || d.id === id);
      const matchedModule = modules.find((m) => m._id === id || m.id === id);
      if (matchedDevice) {
        deviceList = { ...deviceList, ...matchedDevice };
      }
      if (matchedModule) {
        const moduleData = devices
          .map((dev) => {
            const { modules: mods, ...rest } = dev;
            return rest;
          })
          .find((mod) => mod._id === deviceList.bridge || mod.id === id);
        deviceList.plug = { ...deviceList.plug, ...moduleData };
        deviceList = { ...deviceList, ...matchedModule };
      }
      return deviceList;
    });
    /* then we add the sockets and modules that would belong to a house
    who does not have devices in the corresponding category */
    updatedListDevices = [
      ...updatedListDevices,
      ...devices.filter((dev) => !updatedListDevices.some((device) => device.id === dev._id || device.id === dev.id)),
      ...modules.filter((mod) => !updatedListDevices.some((device) => device.id === mod._id || device.id === mod.id)),
    ];
  } else {
    /* otherwise we retrieve the devices and modules as the API request provides them to us */
    updatedListDevices = [...devices, ...modules];
  }
  updatedListDevices
    .filter((device) => device.type === SUPPORTED_MODULE_TYPE)
    .forEach((device) => {
      if (!device.modules_bridged && device.modules) {
        device.modules_bridged = device.modules.map((module) => module._id || module.id);
      }
    });
  return updatedListDevices;
}

module.exports = {
  mergeDeviceDetails,
};
