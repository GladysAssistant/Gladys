const logger = require('../../../../utils/logger');
const RFtoObj = require('../../api/rflink.parse.RFtoObject');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

/**
 * @description when a message is received by the rflink gateway
 * @param {string} msgRF - The message.
 * @example
 * rflink.message(msg);
 */
function message(msgRF) {
  this.lastCommand = msgRF;
  const msg = RFtoObj(msgRF);
  let newDevice;

  if (typeof msg.id === 'string') {
    if (msg.id.includes('=') === false) {
      const doesntExistYet = this.device[msg.id] === undefined;

      if (doesntExistYet === true) {
        const model = `${msg.protocol.charAt(0).toUpperCase()}${msg.protocol.toLowerCase().slice(1)}`;

        newDevice = {
          service_id: this.serviceId,
          name: `${msg.protocol} `,
          selector: `rflink:${msg.id}:${msg.switch}`,
          external_id: `rflink:${msg.id}:${msg.switch}`,
          model,
          should_poll: false,
          features: [],
        };

        if (msg.temp !== undefined) {
          newDevice.name += 'temperature sensor';
          newDevice.features.push({
            name: 'temperature',
            selector: `rflink:${msg.id}:temperature:${msg.switch}`,
            external_id: `rflink:${msg.id}:temperature:${msg.switch}`,
            rfcode: 'TEMP',
            category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
            type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
            unit: DEVICE_FEATURE_UNITS.CELSIUS,
            read_only: true,
            keep_history: true,
            has_feedback: false,
            min: -50,
            max: 100,
          });
        }
        if (msg.hum !== undefined) {
          newDevice.features.push({
            name: 'humidity',
            selector: `rflink:${msg.id}:humidity:${msg.switch}`,
            external_id: `rflink:${msg.id}:humidity:${msg.switch}`,
            rfcode: 'HUM',
            category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
            type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
            unit: DEVICE_FEATURE_UNITS.PERCENT,
            read_only: true,
            keep_history: true,
            has_feedback: false,
            min: 0,
            max: 100,
          });
        }
        if (msg.baro !== undefined) {
          newDevice.name += 'pressure sensor';
          newDevice.features.push({
            name: 'pressure',
            selector: `rflink:${msg.id}:pressure:${msg.switch}`,
            external_id: `rflink:${msg.id}:pressure:${msg.switch}`,
            rfcode: 'BARO',
            category: DEVICE_FEATURE_CATEGORIES.PRESSURE_SENSOR,
            type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
            unit: DEVICE_FEATURE_UNITS.PASCAL,
            read_only: true,
            keep_history: true,
            has_feedback: false,
            min: 0,
            max: 100000000,
          });
        }
        if (msg.uv !== undefined) {
          newDevice.name += 'uv sensor';
          newDevice.features.push({
            name: 'uv intensity',
            selector: `rflink:${msg.id}:uv:${msg.switch}`,
            external_id: `rflink:${msg.id}:uv:${msg.switch}`,
            rfcode: 'UV',
            category: DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR,
            type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
            read_only: true,
            keep_history: true,
            has_feedback: false,
            min: -50,
            max: 100,
          });
        }
        if (msg.lux !== undefined) {
          newDevice.name += 'light sensor';
          newDevice.features.push({
            name: 'light intensity',
            selector: `rflink:${msg.id}:light-intensity:${msg.switch}`,
            external_id: `rflink:${msg.id}:light-intensity:${msg.switch}`,
            rfcode: 'LUX',
            category: DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR,
            type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
            unit: DEVICE_FEATURE_UNITS.LUX,
            read_only: true,
            keep_history: true,
            has_feedback: false,
            min: -50,
            max: 100,
          });
        }
        if (msg.bat !== undefined) {
          newDevice.features.push({
            name: 'battery',
            selector: `rflink:${msg.id}:battery:${msg.switch}`,
            external_id: `rflink:${msg.id}:battery:${msg.switch}`,
            rfcode: 'BAT',
            category: DEVICE_FEATURE_CATEGORIES.BATTERY,
            type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
            unit: DEVICE_FEATURE_UNITS.PERCENT,
            read_only: true,
            keep_history: true,
            has_feedback: false,
            min: 0,
            max: 100,
          });
        }
        if (msg.rain !== undefined || msg.rainrate !== undefined) {
          newDevice.name += 'rain sensor';
          newDevice.features.push({
            name: 'rain',
            selector: `rflink:${msg.id}:rain:${msg.switch}`,
            external_id: `rflink:${msg.id}:rain:${msg.switch}`,
            rfcode: 'RAIN',
            category: DEVICE_FEATURE_CATEGORIES.RAIN_SENSOR,
            type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
            read_only: true,
            keep_history: true,
            has_feedback: false,
            min: 0,
            max: 1000,
          });
        }
        if (msg.winsp !== undefined || msg.awinsp !== undefined || msg.wings !== undefined) {
          newDevice.name += 'wind speed sensor';
          newDevice.features.push({
            name: 'wind speed',
            selector: `rflink:${msg.id}:wind-speed:${msg.switch}`,
            external_id: `rflink:${msg.id}:wind-speed:${msg.switch}`,
            rfcode: 'WINSP',
            category: DEVICE_FEATURE_CATEGORIES.WIND_SENSOR,
            type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
            read_only: true,
            keep_history: true,
            has_feedback: false,
            min: 0,
            max: 500,
          });
        }
        if (msg.windir !== undefined) {
          newDevice.name += 'wind direction sensor';
          newDevice.features.push({
            name: 'wind direction',
            selector: `rflink:${msg.id}:wind-dir:${msg.switch}`,
            external_id: `rflink:${msg.id}:wind-dir:${msg.switch}`,
            rfcode: 'WINDIR',
            category: DEVICE_FEATURE_CATEGORIES.WIND_SENSOR,
            type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
            read_only: true,
            keep_history: true,
            has_feedback: false,
            min: 0,
            max: 100,
          });
        }
        if (msg.co2 !== undefined) {
          newDevice.name += 'co2 sensor';
          newDevice.features.push({
            name: 'co2',
            selector: `rflink:${msg.id}:co2:${msg.switch}`,
            external_id: `rflink:${msg.id}:co2:${msg.switch}`,
            rfcode: 'CO2',
            category: DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
            type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
            read_only: true,
            keep_history: true,
            has_feedback: false,
            min: 0,
            max: 1000,
          });
        }
        if (
          msg.switch !== undefined &&
          msg.rgwb === undefined &&
          (msg.cmd === 'ON' || msg.cmd === 'OFF' || msg.cmd === 'ALLON' || msg.cmd === 'ALLOFF')
        ) {
          newDevice.name += 'switch';
          newDevice.features.push({
            name: 'switch',
            selector: `rflink:${msg.id}:switch:${msg.switch}`,
            external_id: `rflink:${msg.id}:switch:${msg.switch}`,
            rfcode: 'CMD',
            category: DEVICE_FEATURE_CATEGORIES.SWITCH,
            type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
            read_only: true,
            keep_history: true,
            has_feedback: false,
            min: 0,
            max: 1,
          });
        }

        if (msg.switch !== undefined && msg.rgwb === undefined && (msg.cmd === 'UP' || msg.cmd === 'DOWN')) {
          newDevice.name += 'switch';
          newDevice.features.push({
            name: 'switch',
            selector: `rflink:${msg.id}:switch:${msg.switch}`,
            external_id: `rflink:${msg.id}:switch:${msg.switch}`,
            rfcode: 'CMD',
            category: DEVICE_FEATURE_CATEGORIES.BUTTON,
            type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
            read_only: false,
            keep_history: true,
            has_feedback: false,
            min: 0,
            max: 1,
          });
        }

        if (msg.rgbw !== undefined || msg.cmd.includes('MODE') === true || msg.cmd.includes('DISCO') === true) {
          newDevice.selector = `rflink:milight:${msg.id}:${msg.switch}`;
          newDevice.external_id = `rflink:milight:${msg.id}:${msg.switch}`;
          newDevice.features.push(
            {
              name: 'Power',
              selector: `rflink:milight:${msg.id}:${msg.switch}:power`,
              external_id: `rflink:milight:${msg.id}:${msg.switch}:power`,
              rfcode: {
                value: 'CMD',
                cmd: 'ON',
              },
              category: DEVICE_FEATURE_CATEGORIES.LIGHT,
              type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
              read_only: false,
              keep_history: true,
              has_feedback: false,
              min: 0,
              max: 1,
            },
            {
              name: 'color',
              selector: `rflink:milight:${msg.id}:${msg.switch}:color`,
              external_id: `rflink:milight:${msg.id}:${msg.switch}:color`,
              rfcode: {
                value: 'RGBW',
                cmd: 'COLOR',
              },
              category: DEVICE_FEATURE_CATEGORIES.LIGHT,
              type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
              read_only: false,
              keep_history: true,
              has_feedback: false,
              min: 0,
              max: 255,
            },
          );
          newDevice.features.push({
            name: 'brightness',
            selector: `rflink:milight:${msg.id}:${msg.switch}:brightness`,
            external_id: `rflink:milight:${msg.id}:${msg.switch}:brightness`,
            rfcode: {
              value: 'RGBW',
              cmd: 'BRIGHT',
            },
            category: DEVICE_FEATURE_CATEGORIES.LIGHT,
            type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
            read_only: false,
            keep_history: true,
            has_feedback: false,
            min: 0,
            max: 100,
          });
          newDevice.features.push({
            name: 'milight-mode',
            selector: `rflink:milight:${msg.id}:${msg.switch}:milight-mode`,
            external_id: `rflink:milight:${msg.id}:${msg.switch}:milight-mode`,
            rfcode: 'CMD',
            category: DEVICE_FEATURE_CATEGORIES.LIGHT,
            type: DEVICE_FEATURE_TYPES.LIGHT.MODE,
            read_only: false,
            keep_history: true,
            has_feedback: false,
            min: 1,
            max: 8,
          });
        }

        this.addDevice(newDevice);
      } else if (doesntExistYet === false) {
        if (msg.temp !== undefined) {
          this.newValue(msg, 'temperature', msg.temp);
        }
        if (msg.hum !== undefined) {
          this.newValue(msg, 'humidity', msg.hum);
        }
        if (msg.uv !== undefined) {
          this.newValue(msg, 'uv', msg.uv);
        }
        if (msg.lux !== undefined) {
          this.newValue(msg, 'light-intensity', msg.lux);
        }
        if (msg.bat !== undefined) {
          this.newValue(msg, 'battery', msg.bat);
        }
        if (msg.rain !== undefined) {
          this.newValue(msg, 'rain', msg.rain);
        }
        if (msg.temp !== undefined) {
          this.newValue(msg, 'temperature', msg.temp);
        }
        if (msg.winsp !== undefined) {
          this.newValue(msg, 'wind-speed', msg.winsp);
        }
        if (msg.awinsp !== undefined) {
          this.newValue(msg, 'wind-speed', msg.awinsp);
        }
        if (msg.wings !== undefined) {
          this.newValue(msg, 'wind-speed', msg.wings);
        }
        if (msg.windir !== undefined) {
          this.newValue(msg, 'wind-dir', msg.windir);
        }
        if (msg.co2 !== undefined) {
          this.newValue(msg, 'co2', msg.co2);
        }
        if (msg.wings !== undefined) {
          this.newValue(msg, 'wind-speed', msg.wings);
        }
        if (
          msg.switch !== undefined &&
          (msg.cmd === 'ON' || msg.cmd === 'OFF' || msg.cmd === 'ALLON' || msg.cmd === 'ALLOFF')
        ) {
          this.newValue(msg, 'switch', msg.cmd);
        }
        if (msg.rgbw !== undefined) {
          this.newValue(msg, 'color', msg.rgbw);
          this.newValue(msg, 'brightness', msg.rgbw);
        }
        if (msg.cmd.includes('MODE') === true) {
          this.newValue(msg, 'milight-mode', msg.cmd);
        }
        if (msg.cmd.includes('DISCO') === true) {
          this.newValue(msg, 'milight-mode', msg.cmd);
        }
      }
      // const features =
    } else {
      logger.log(`${msg.id} n'est pas une id valide`);
    }
  }
}

module.exports = {
  message,
};
