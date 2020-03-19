const logger = require('../../../utils/logger');

// eslint-disable-next-line jsdoc/check-alignment
/** 
* @description convert a rflink device object to a string that can be sent to rflink
* @param {Object} device - Secure node.
* @param {string} deviceFeature - The devicce feature.
* @param state - The state of the device.
* @example
* rflink.ObjToRF(device);
*/
function ObjToRF(device, deviceFeature, state) {
    const id = device.external_id.split(':')[1];
    const channel = device.external_id.split(':')[2];

    let Rfcode = `10;${device.model};${id};`;

    if (channel !== undefined) {
        Rfcode += `${channel};`;
    } else {
        logger.log('channel undefined');
    }

    if (state !== undefined) {
        Rfcode += `${state};`;
    } else {
        logger.log('no state');
    };

    Rfcode += '\n';


        
    
    return Rfcode;
};

module.exports = ObjToRF;