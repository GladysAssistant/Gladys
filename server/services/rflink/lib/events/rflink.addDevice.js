/* eslint-disable no-prototype-builtins */
/* eslint-disable no-restricted-syntax */
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');


/**
 * @description Add device.
 * @param {Object} device - Device to add.
 * @example
 * Rflink.addDevice(device);
 */
function addDevice(device) {
    const id = device.external_id.split(':')[1];
    

    this.gladys.event.emit(EVENTS.DEVICE.NEW, 
         device,
    );

    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type : WEBSOCKET_MESSAGE_TYPES.RFLINK.NEW_DEVICE,
        payload : device,
    });

    this.device[id] = device;


    




     


}

module.exports = {addDevice};