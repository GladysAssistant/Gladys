const { EVENTS } = require('../../../../utils/constants');

/**
 * @description Poll value of a Netatmo devices
 * @param {Object} device - The device to control.
 * @example
 * poll(device);
 */
async function poll(device) {
  const axios = require('axios');
  const info = device.external_id.split('netatmo:');
  const sid = info[1];
  this.getDevices();
  if (this.devices[sid].type === 'NACamera' || this.devices[sid].type === 'NOC') {
    axios.get(this.devices[sid].vpn_url+'/live/snapshot_720.jpg', {responseType: 'arraybuffer'}).then(response => {
      function _imageEncode (arrayBuffer) {
        let u8 = new Uint8Array(arrayBuffer)
        let b64encoded = btoa([].reduce.call(new Uint8Array(arrayBuffer),function(p,c){return p+String.fromCharCode(c)},''))
        let mimetype="image/jpeg"
        return "data:"+mimetype+";base64,"+b64encoded
      }
      this.gladys.device.camera.setImage(device.selector, _imageEncode(response.data));
    })
  }
  if (this.devices[sid].type === 'NATherm1') {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `netatmo:${sid}:battery`,
      state: this.devices[sid].battery_percent,
    });
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `netatmo:${sid}:temperature`,
      state: this.devices[sid].measured.temperature,
    });
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `netatmo:${sid}:setpoint`,
      state: this.devices[sid].measured.setpoint_temp,
    });
  }
  if (this.devices[sid].type === 'NAMain') {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `netatmo:${sid}:temperature`,
      state: this.devices[sid].dashboard_data.Temperature,
    });
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `netatmo:${sid}:humidity`,
      state: this.devices[sid].dashboard_data.Humidity,
    });
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `netatmo:${sid}:co2`,
      state: this.devices[sid].dashboard_data.CO2,
    });
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `netatmo:${sid}:pressure`,
      state: this.devices[sid].dashboard_data.Pressure,
    });
    /* eslint-disable no-restricted-syntax */
    let sidModule;
    for (const module of this.devices[sid].modules) {
      /* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
      sidModule = module._id;
      if (module.data_type[0] === 'Rain') {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sidModule}:rain`,
          state: this.devices[sidModule].dashboard_data.Rain,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sidModule}:sum_rain_1`,
          state: this.devices[sidModule].dashboard_data.sum_rain_1,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sidModule}:sum_rain_24`,
          state: this.devices[sidModule].dashboard_data.sum_rain_24,
        });
      }
      if (module.data_type[0] === 'Wind') {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sidModule}:WindStrength`,
          state: this.devices[sidModule].dashboard_data.WindStrength,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sidModule}:WindAngle`,
          state: this.devices[sidModule].dashboard_data.WindAngle,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sidModule}:GustStrength`,
          state: this.devices[sidModule].dashboard_data.GustStrength,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sidModule}:WindAngle`,
          state: this.devices[sidModule].dashboard_data.GustAngle,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sidModule}:max_wind_str`,
          state: this.devices[sidModule].dashboard_data.max_wind_str,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sidModule}:max_wind_angle`,
          state: this.devices[sidModule].dashboard_data.max_wind_angle,
        });
      }
      if (module.data_type[0] === 'Temperature' && module.data_type[1] === 'Humidity') {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sidModule}:temperature`,
          state: this.devices[sidModule].dashboard_data.Temperature,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sidModule}:humidity`,
          state: this.devices[sidModule].dashboard_data.Humidity,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sidModule}:min_temp`,
          state: this.devices[sidModule].dashboard_data.min_temp,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sidModule}:max_temp`,
          state: this.devices[sidModule].dashboard_data.max_temp,
        });
      }
    }
  }
}

module.exports = {
  poll,
};
