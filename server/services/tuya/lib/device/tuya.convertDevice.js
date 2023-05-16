const { DEVICE_POLL_FREQUENCIES } = require('../../../../utils/constants');
const { convertFeature } = require('./feature/tuya.convertFeature');

/**
 * @description Transform Tuya device to Gladys device.
 * @param {object} tuyaDevice - Tuya device.
 * @returns {object} Glladys device.
 * @example
 * tuya.convertDevice({ ... });
 */
function convertDevice(tuyaDevice) {
  // console.log('tuyaDevice', tuyaDevice);
  const { name, product_name: model, uuid, specifications = {} } = tuyaDevice;
  const externalId = `tuya:${uuid}`;
  const { functions = [], status = [] } = specifications;

  // Groups functions and status on same code
  const groups = {};
  // console.log('tuyaDevice: functions', functions);
  functions.forEach((func) => {
    const { code } = func;
    groups[code] = { ...func, readOnly: false };
  });

  // console.log('groups', groups, Object.values(groups));

  /*
  console.log('tuyaDevice: status', status);
  status.forEach((stat) => {
    const { code } = stat;
    let group = {};
    if(groups[code]){
      group = groups[code];
    }
    groups[code] = { ...stat, ...group, readOnly: true };
  });
   */

  const features = Object.values(groups).map((group) => convertFeature(group, externalId));



  const device =  {
    name,
    features: features.filter((feature) => feature),
    external_id: externalId,
    selector: externalId,
    model,
    service_id: this.serviceId,
    poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
  };
  // console.log('gladysDevice', device);
  return device;
}

module.exports = {
  convertDevice,
};
