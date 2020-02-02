
// eslint-disable-next-line jsdoc/check-alignment
/** 
* @description convert a rflink device object to a string that can be sent to rflink
* @param {Object} device - Secure node.
* @example
* rflink.ObjToRF(device);
*/
function ObjToRF(device) {
    const id = device.external_id.slit(':')[1];

    let Rfcode = `10;${device.model};${id};`;

    for (let i = 0;i<device.features.length;i += 1) {
        Rfcode += `${device.features[i].rfcode};`;
    }

        
    
    return Rfcode;
};

module.exports = {
    ObjToRF,
};