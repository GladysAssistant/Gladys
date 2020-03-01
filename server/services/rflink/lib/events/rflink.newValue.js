const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
// eslint-disable-next-line jsdoc/require-param
/**
 * @description When a new value is received.
 * @param {Object} device - Device to update.
 * @param {string} deviceFeature - Feature to update.
 * @example
 *  newValue(Object, 'temperature', 30)
 */
function newValue(device, deviceFeature, state) {

    logger.debug(`RFlink : value ${deviceFeature} of device ${device} changed to ${state}`);

    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `rflink:${device.id}:${deviceFeature}`,
        state,
    });

}

module.exports = {
    newValue,
};