const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

/**
 * @description Add sensor.
 * @param {string} sid - Netatmo SID.
 * @param {Object} sensor - Sensor to add.
 * @example
 * netatmo.addSensor(sid, sensor);
 */
function addSensor(sid, sensor) {
  const doesntExistYet = this.sensors[sid] === undefined;
  this.sensors[sid] = sensor;
  if (doesntExistYet) {
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.XIAOMI.NEW_DEVICE,
      payload: sensor,
    });
  }
}

module.exports = {
  addSensor,
};
