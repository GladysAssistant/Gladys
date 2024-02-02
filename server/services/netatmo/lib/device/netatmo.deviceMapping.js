const fse = require('fs-extra');
const ffmpeg = require('fluent-ffmpeg');
const { DEVICE_FEATURE_TYPES, DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');

const writeValues = {
  [DEVICE_FEATURE_CATEGORIES.THERMOSTAT]: {
    /* therm_setpoint_temperature: 14 */
    [DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE]: (valueFromDevice) => {
      return valueFromDevice;
    },
  },
};

const readValues = {
  [DEVICE_FEATURE_CATEGORIES.THERMOSTAT]: {
    [DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE]: (valueFromDevice) => {
      return valueFromDevice;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.SWITCH]: {
    /* plug_connected_boiler: 1 or boiler_status: true */
    [DEVICE_FEATURE_TYPES.SWITCH.BINARY]: (valueFromDevice) => {
      const valueToGladys = valueFromDevice === true || valueFromDevice === 1 ? 1 : 0;
      return valueToGladys;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.BATTERY]: {
    /* battery_percent: 76 or battery_state: 'medium' */
    [DEVICE_FEATURE_TYPES.BATTERY.INTEGER]: (valueFromDevice) => {
      const batteryLevels = {
        max: 100,
        full: 90,
        high: 75,
        medium: 50,
        low: 25,
        'very low': 10,
      };

      const valueToGladys =
        batteryLevels[valueFromDevice] !== undefined ? batteryLevels[valueFromDevice] : parseInt(valueFromDevice, 10);
      return valueToGladys;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR]: {
    /* temperature: 20.5 */
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: (valueFromDevice) => {
      return valueFromDevice;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.SIGNAL]: {
    /* rf_strength: 76 or wifi_strength: 76 */
    [DEVICE_FEATURE_TYPES.SIGNAL.QUALITY]: (valueFromDevice) => {
      const valueToGladys = parseInt(valueFromDevice, 10);
      return valueToGladys;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR]: {
    /* room.open_window: false */
    [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: (valueFromDevice) => {
      const valueToGladys = valueFromDevice === true || valueFromDevice === 1 ? 1 : 0;
      return valueToGladys;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.CO2_SENSOR]: {
    /* co2: 550 */
    [DEVICE_FEATURE_TYPES.SENSOR.INTEGER]: (valueFromDevice) => {
      const valueToGladys = parseInt(valueFromDevice, 10);
      return valueToGladys;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR]: {
    /* humidity: 26 */
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: (valueFromDevice) => {
      return valueFromDevice;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.NOISE_SENSOR]: {
    /* noise: 32 */
    [DEVICE_FEATURE_TYPES.SENSOR.INTEGER]: (valueFromDevice) => {
      const valueToGladys = parseInt(valueFromDevice, 10);
      return valueToGladys;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.PRESSURE_SENSOR]: {
    /* pressure: 1050 or absolute_pressure: 1018 */
    [DEVICE_FEATURE_TYPES.SENSOR.INTEGER]: (valueFromDevice) => {
      const valueToGladys = parseInt(valueFromDevice, 10);
      return valueToGladys;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.SPEED_SENSOR]: {
    /* wind_strength: 5 */
    [DEVICE_FEATURE_TYPES.SPEED_SENSOR.INTEGER]: (valueFromDevice) => {
      const valueToGladys = parseInt(valueFromDevice, 10);
      return valueToGladys;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.ANGLE_SENSOR]: {
    /* wind_angle: 120 */
    [DEVICE_FEATURE_TYPES.SENSOR.INTEGER]: (valueFromDevice) => {
      const valueToGladys = parseInt(valueFromDevice, 10);
      return valueToGladys;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.PRECIPITATION_SENSOR]: {
    /* rain: 1.5 or sum_rain_1: 5.1 or sum_rain_24: 10.1 */
    [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: (valueFromDevice) => {
      return valueFromDevice;
    },
  },
  [DEVICE_FEATURE_CATEGORIES.CAMERA]: {
    /* vpn_url: https://prodvpn-eu-1.netatmo.net/restricted/10.255.10.50/xxxxxxxxxxxxxxxxxxxxxxxx/Mxxxxxxxxxxxxxxxxxxxxx_xxxxxxx,,/live/snapshot_720.jpg */
    [DEVICE_FEATURE_TYPES.CAMERA.IMAGE]: (selectorCamera, filePath, valueFromDevice) => {
      // we create a writestream
      const writeStream = fse.createWriteStream(filePath);
      // and send a camera thumbnail to this stream
      ffmpeg(valueFromDevice)
        .format('image2pipe') //TODO image2 is deprecated, use image2pipe
        .outputOptions('-vframes 1')
        // resize the image with max width = 640
        .outputOptions('-vf scale=720:-1')
        //  Effective range for JPEG is 2-31 with 31 being the worst quality.
        .outputOptions('-qscale:v 15')
        .output(writeStream)
        .on('end', async () => {
          const image = await fse.readFile(filePath);

          // convert binary data to base64 encoded string
          const cameraImageBase = Buffer.from(image).toString('base64');
          const cameraImage = `image/png;base64,${cameraImageBase}`;
          // logger.debug(cameraImage);
          this.gladys.device.camera.setImage(selectorCamera, cameraImage);
          await fse.remove(filePath);
        })
        .on('error', async (err, stdout, stderr) => {
          logger.error(`Cannot process video: ${err.message}`);
          logger.error(stderr);
          logger.error(err.message);
          await fse.remove(filePath);
        })
        .run();
      return valueFromDevice;
    },
  },
};

module.exports = { readValues, writeValues };
