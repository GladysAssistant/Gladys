const {
  OnOff,
  OccupancySensing,
  IlluminanceMeasurement,
  TemperatureMeasurement,
  WindowCovering,
  LevelControl,
  ColorControl,
  RelativeHumidityMeasurement,
  Thermostat,
  Pm25ConcentrationMeasurement,
  // eslint-disable-next-line import/no-unresolved
} = require('@matter/main/clusters');

const logger = require('../../../utils/logger');
const { hsbToRgb, rgbToInt } = require('../../../utils/colors');
const { EVENTS, STATE } = require('../../../utils/constants');

/**
 * @description Listen to state changes of a device.
 * @param {bigint} nodeId - The node ID of the device.
 * @param {string} devicePath - The path of the device.
 * @param {object} device - The device object.
 * @example matter.listenToStateChange(nodeId, device);
 */
async function listenToStateChange(nodeId, devicePath, device) {
  // Get the OnOff cluster from clusterClients map
  const onOff = device.clusterClients.get(OnOff.Complete.id);

  // We only add the listener if it's not already added
  if (onOff && !this.stateChangeListeners.has(onOff)) {
    logger.debug(`Matter: Adding state change listener for OnOff cluster ${onOff.name}`);
    this.stateChangeListeners.add(onOff);
    // Subscribe to OnOff attribute changes
    onOff.addOnOffAttributeListener((value) => {
      logger.debug(`Matter: OnOff attribute changed to ${value}`);
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `matter:${nodeId}:${devicePath}:${OnOff.Complete.id}`,
        state: value ? STATE.ON : STATE.OFF,
      });
    });
  }

  const occupancy = device.clusterClients.get(OccupancySensing.Complete.id);
  if (occupancy && !this.stateChangeListeners.has(occupancy)) {
    logger.debug(`Matter: Adding state change listener for OccupancySensing cluster ${occupancy.name}`);
    this.stateChangeListeners.add(occupancy);
    // Subscribe to OccupancySensing attribute changes
    occupancy.addOccupancyAttributeListener((value) => {
      logger.debug(`Matter: Occupancy attribute changed to ${value}`);
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `matter:${nodeId}:${devicePath}:${OccupancySensing.Complete.id}`,
        state: value.occupied ? STATE.ON : STATE.OFF,
      });
    });
  }

  const illuminance = device.clusterClients.get(IlluminanceMeasurement.Complete.id);
  if (illuminance && !this.stateChangeListeners.has(illuminance)) {
    logger.debug(`Matter: Adding state change listener for IlluminanceMeasurement cluster ${illuminance.name}`);
    this.stateChangeListeners.add(illuminance);
    // Subscribe to IlluminanceMeasurement attribute changes
    illuminance.addMeasuredValueAttributeListener((value) => {
      const luxValue = Math.round(10 ** ((value - 1) / 10000));
      logger.debug(`Matter: Illuminance attribute changed to ${value} (Converted to ${luxValue} lux)`);
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `matter:${nodeId}:${devicePath}:${IlluminanceMeasurement.Complete.id}`,
        state: luxValue,
      });
    });
  }

  const temperatureSensor = device.clusterClients.get(TemperatureMeasurement.Complete.id);
  if (temperatureSensor && !this.stateChangeListeners.has(temperatureSensor)) {
    logger.debug(`Matter: Adding state change listener for TemperatureMeasurement cluster ${temperatureSensor.name}`);
    this.stateChangeListeners.add(temperatureSensor);
    // Subscribe to TemperatureMeasurement attribute changes
    temperatureSensor.addMeasuredValueAttributeListener((value) => {
      logger.debug(`Matter: Temperature attribute changed to ${value}`);
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `matter:${nodeId}:${devicePath}:${TemperatureMeasurement.Complete.id}`,
        state: value / 100,
      });
    });
  }

  const windowCover = device.clusterClients.get(WindowCovering.Complete.id);

  if (windowCover && !this.stateChangeListeners.has(windowCover)) {
    logger.debug(`Matter: Adding state change listener for WindowCovering cluster ${windowCover.name}`);
    this.stateChangeListeners.add(windowCover);
    // Subscribe to change in position
    windowCover.addCurrentPositionLiftPercent100thsAttributeListener((value) => {
      logger.debug(`Matter: WindowCovering attribute changed to ${value}`);
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `matter:${nodeId}:${devicePath}:${WindowCovering.Complete.id}:position`,
        state: value / 100,
      });
    });
  }

  const levelControl = device.clusterClients.get(LevelControl.Complete.id);
  if (levelControl && !this.stateChangeListeners.has(levelControl)) {
    logger.debug(`Matter: Adding state change listener for LevelControl cluster ${levelControl.name}`);
    this.stateChangeListeners.add(levelControl);
    // Subscribe to change in brightness
    levelControl.addCurrentLevelAttributeListener((value) => {
      logger.debug(`Matter: LevelControl attribute changed to ${value}`);
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `matter:${nodeId}:${devicePath}:${LevelControl.Complete.id}`,
        state: value,
      });
    });
  }

  const colorControl = device.clusterClients.get(ColorControl.Complete.id);
  if (colorControl && !this.stateChangeListeners.has(colorControl)) {
    logger.debug(`Matter: Adding state change listener for ColorControl cluster ${colorControl.name}`);
    this.stateChangeListeners.add(colorControl);
    // Function to convert HSB to integer and emit state change
    const emitColorState = async () => {
      logger.debug(`Matter: Emitting color state`);
      // Get current hue and saturation values
      const currentHue = await colorControl.getCurrentHueAttribute();
      const currentSaturation = await colorControl.getCurrentSaturationAttribute();
      const currentBrightness = 100; // Default to full brightness

      // Convert HSB to RGB
      // Matter uses hue in range 0-254, saturation in range 0-254
      // Our hsbToRgb expects hue in degrees (0-360) and saturation in percent (0-100)
      const hue = Math.round((currentHue / 254) * 360);
      const saturation = Math.round((currentSaturation / 254) * 100);

      // Convert HSB to RGB
      const rgb = hsbToRgb([hue, saturation, currentBrightness]);

      // Convert RGB to integer
      const intColor = rgbToInt(rgb);

      // Emit the state change event with the integer color
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `matter:${nodeId}:${devicePath}:${ColorControl.Complete.id}:color`,
        state: intColor,
      });
    };

    if (colorControl.supportedFeatures.hueSaturation) {
      // Listen for hue changes
      colorControl.addCurrentHueAttributeListener(() => {
        emitColorState();
      });

      // Listen for saturation changes
      colorControl.addCurrentSaturationAttributeListener(() => {
        emitColorState();
      });
    }
  }

  const relativeHumidityMeasurement = device.clusterClients.get(RelativeHumidityMeasurement.Complete.id);
  if (relativeHumidityMeasurement && !this.stateChangeListeners.has(relativeHumidityMeasurement)) {
    logger.debug(
      `Matter: Adding state change listener for RelativeHumidityMeasurement cluster ${relativeHumidityMeasurement.name}`,
    );
    this.stateChangeListeners.add(relativeHumidityMeasurement);
    // Subscribe to RelativeHumidityMeasurement attribute changes
    relativeHumidityMeasurement.addMeasuredValueAttributeListener((value) => {
      logger.debug(`Matter: RelativeHumidityMeasurement attribute changed to ${value}`);
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `matter:${nodeId}:${devicePath}:${RelativeHumidityMeasurement.Complete.id}`,
        state: value / 100,
      });
    });
  }

  const pm25ConcentrationMeasurement = device.clusterClients.get(Pm25ConcentrationMeasurement.Complete.id);
  if (pm25ConcentrationMeasurement && !this.stateChangeListeners.has(pm25ConcentrationMeasurement)) {
    logger.debug(
      `Matter: Adding state change listener for Pm25ConcentrationMeasurement cluster ${pm25ConcentrationMeasurement.name}`,
    );
    this.stateChangeListeners.add(pm25ConcentrationMeasurement);
    // Subscribe to Pm25ConcentrationMeasurement attribute changes
    pm25ConcentrationMeasurement.addMeasuredValueAttributeListener((value) => {
      logger.debug(`Matter: Pm25ConcentrationMeasurement attribute changed to ${value}`);
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `matter:${nodeId}:${devicePath}:${Pm25ConcentrationMeasurement.Complete.id}`,
        state: value,
      });
    });
  }

  const thermostat = device.clusterClients.get(Thermostat.Complete.id);
  if (thermostat && !this.stateChangeListeners.has(thermostat)) {
    logger.debug(`Matter: Adding state change listener for Thermostat cluster ${thermostat.name}`);
    this.stateChangeListeners.add(thermostat);
    // Subscribe to thermostat attribute changes
    if (thermostat.supportedFeatures.heating) {
      thermostat.addOccupiedHeatingSetpointAttributeListener((value) => {
        logger.debug(`Matter: Thermostat heating attribute changed to ${value}`);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${Thermostat.Complete.id}:heating`,
          state: value / 100,
        });
      });
    }
    if (thermostat.supportedFeatures.cooling) {
      thermostat.addOccupiedCoolingSetpointAttributeListener((value) => {
        logger.debug(`Matter: Thermostat cooling attribute changed to ${value}`);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${Thermostat.Complete.id}:cooling`,
          state: value / 100,
        });
      });
    }
  }
}

module.exports = {
  listenToStateChange,
};
