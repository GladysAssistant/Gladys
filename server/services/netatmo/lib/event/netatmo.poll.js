const { EVENTS } = require('../../../../utils/constants');

/**
 * @description Poll value of a Netatmo devices
 * @param {Object} device - The device to control.
 * @example
 * poll(device);
 */
async function poll(device) {
  const info = device.external_id.split('netatmo:');
  const sid = info[1];
  this.getDevices();
  if (this.devices[sid].type === 'NATherm1') {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `netatmo:${sid}:battery`,
      state: this.devices[sid].battery_percent
    });
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `netatmo:${sid}:temperature`,
      state: this.devices[sid].measured.temperature
    });
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `netatmo:${sid}:setpoint`,
      state: this.devices[sid].measured.setpoint_temp
    });
  }
  if (this.devices[sid].type === 'NAMain') {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `netatmo:${sid}:temperature`,
      state: this.devices[sid].dashboard_data.Temperature
    });
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `netatmo:${sid}:humidity`,
      state: this.devices[sid].dashboard_data.Humidity
    });
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `netatmo:${sid}:co2`,
      state: this.devices[sid].dashboard_data.CO2
    });
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `netatmo:${sid}:pressure`,
      state: this.devices[sid].dashboard_data.Pressure
    });
  }

}

module.exports = {
  poll,
};
