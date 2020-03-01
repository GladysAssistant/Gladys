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
    let msg;
    let value;
    logger.log(device.external_id);

    if (state === 0 || state === false) {
        value = 'OFF';
    }

    switch (state) {
        case 0:
        case false : 
            value = 'OFF';

        break;
        case 1:
        case true : 
            value = 'ON';

        break;
        default : 
            value = state;
        break;

    }



    if (device.external_id.split(':')[1] === 'milight') {
        // Send a milight rflink message

    } else {
        
        msg = ObjToRF(device, deviceFeature, value); 

    }
    logger.log(msg);
    
    this.sendUsb.write(msg, error => {
        console.log(error);
    });
    

}


module.exports = {
    setValue,
};