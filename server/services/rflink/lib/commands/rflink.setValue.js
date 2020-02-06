const ObjToRF = require('../../api/rflink.parse.ObjToRF');
const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
/**
 * @description send a message to change a device's value
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The feature to control.
 * @param {Object} state - The new state.
 * @example 
 * rflink.SetValue(2a11d,{name : action , value : ON});
 */
function SetValue(device, deviceFeature, state)  {
    this.newValue(device, deviceFeature, state);
    


    const msg = ObjToRF.ObjToRF(device);
    this.usb.write(msg);
    

}


module.exports = {
    SetValue,
};