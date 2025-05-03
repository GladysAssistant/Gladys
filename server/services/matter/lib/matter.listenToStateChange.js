const {
  OnOff,
  OccupancySensing,
  IlluminanceMeasurement,
  TemperatureMeasurement,
  WindowCovering,
  LevelControl,
  ColorControl,
  // eslint-disable-next-line import/no-unresolved
} = require('@matter/main/clusters');
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

  if (onOff) {
    // Subscribe to OnOff attribute changes
    onOff.addOnOffAttributeListener((value) => {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `matter:${nodeId}:${devicePath}:${OnOff.Complete.id}`,
        state: value ? STATE.ON : STATE.OFF,
      });
    });
  }

  const occupancy = device.clusterClients.get(OccupancySensing.Complete.id);
  if (occupancy) {
    // Subscribe to OccupancySensing attribute changes
    occupancy.addOccupancyAttributeListener((value) => {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `matter:${nodeId}:${devicePath}:${OccupancySensing.Complete.id}`,
        state: value.occupied ? STATE.ON : STATE.OFF,
      });
    });
  }

  const illuminance = device.clusterClients.get(IlluminanceMeasurement.Complete.id);
  if (illuminance) {
    // Subscribe to IlluminanceMeasurement attribute changes
    illuminance.addMeasuredValueAttributeListener((value) => {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `matter:${nodeId}:${devicePath}:${IlluminanceMeasurement.Complete.id}`,
        state: Math.round(value / 10),
      });
    });
  }

  const temperatureSensor = device.clusterClients.get(TemperatureMeasurement.Complete.id);
  if (temperatureSensor) {
    // Subscribe to TemperatureMeasurement attribute changes
    temperatureSensor.addMeasuredValueAttributeListener((value) => {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `matter:${nodeId}:${devicePath}:${TemperatureMeasurement.Complete.id}`,
        state: value / 100,
      });
    });
  }

  const windowCover = device.clusterClients.get(WindowCovering.Complete.id);

  if (windowCover) {
    // Subscribe to change in position
    windowCover.addCurrentPositionLiftPercent100thsAttributeListener((value) => {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `matter:${nodeId}:${devicePath}:${WindowCovering.Complete.id}:position`,
        state: value / 100,
      });
    });
  }

  const levelControl = device.clusterClients.get(LevelControl.Complete.id);
  if (levelControl) {
    // Subscribe to change in brightness
    levelControl.addCurrentLevelAttributeListener((value) => {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `matter:${nodeId}:${devicePath}:${LevelControl.Complete.id}`,
        state: value,
      });
    });
  }

  const colorControl = device.clusterClients.get(ColorControl.Complete.id);
  if (colorControl) {
    // Function to convert HSB to integer and emit state change
    const emitColorState = async () => {
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
        device_feature_external_id: `matter:${nodeId}:${devicePath}:${ColorControl.Complete.id}`,
        state: intColor,
      });
    };

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

module.exports = {
  listenToStateChange,
};
