const ObjToRF = require('../../api/rflink.parse.ObjToRF');
const logger = require('../../../../utils/logger');
/**
 * @description send a message to change a device's value
 * @param {Object} device - The device to control.
 * @param {string} deviceFeature - The name of feature to control.
 * @param {any} state - The new state.
 * @example 
 * rflink.SetValue();
 */
function setValue(device, deviceFeature, state)  {
    logger.log(device.model);
    const msg = ObjToRF(device, deviceFeature, state);
    logger.log(msg);
    this.usb.write(msg);
    

}


module.exports = {
    setValue,
};