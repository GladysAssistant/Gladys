// eslint-disable-next-line import/no-unresolved
const { OnOff, WindowCovering, LevelControl, ColorControl, Thermostat } = require('@matter/main/clusters');
const { DEVICE_FEATURE_TYPES, DEVICE_FEATURE_CATEGORIES, COVER_STATE } = require('../../../utils/constants');
const { intToHsb } = require('../../../utils/colors');
const logger = require('../../../utils/logger');

/**
 * @description Find a device recursively through child endpoints.
 * @param {object} parentDevice - The parent device to search in.
 * @param {string[]} path - Array of device numbers to follow.
 * @returns {object|null} - The found device or null.
 * @example
 * const targetDevice = findDeviceRecursively(rootDevice, devicePath.slice(1));
 */
function findDeviceRecursively(parentDevice, path) {
  if (path.length === 0) {
    return parentDevice;
  }

  const [currentNumber, ...remainingPath] = path;

  // If this is a child_endpoint marker, skip to next number
  if (currentNumber === 'child_endpoint') {
    return findDeviceRecursively(parentDevice, remainingPath);
  }

  const deviceNumber = Number(currentNumber);

  // Look in child endpoints
  if (parentDevice.childEndpoints) {
    const childDevice = parentDevice.childEndpoints.find((child) => child.number === deviceNumber);
    if (childDevice) {
      return findDeviceRecursively(childDevice, remainingPath);
    }
  }

  return null;
}

/**
 * @description Set the value of a feature on a device.
 * @param {object} gladysDevice - The Gladys device.
 * @param {object} gladysFeature - The Gladys feature.
 * @param {number} value - The value to set.
 * @example
 * const value = await setValue(gladysDevice, gladysFeature, value);
 */
async function setValue(gladysDevice, gladysFeature, value) {
  // Parse the external_id
  const parts = gladysDevice.external_id.split(':');
  const nodeId = BigInt(parts[1]);

  logger.info(`Setting value for node ${nodeId}, value = ${value}`);
  const node = this.nodesMap.get(nodeId);
  if (!node) {
    throw new Error(`Node ${nodeId} not found`);
  }

  const devices = node.getDevices();

  if (devices.length === 0) {
    throw new Error(`No devices found for node ${nodeId}`);
  }

  // Remove 'matter' and nodeId from parts to get the device path
  const devicePath = parts.slice(2);
  const rootDevice = devices.find((d) => d.number === Number(devicePath[0]));
  if (!rootDevice) {
    throw new Error(`Root device ${devicePath[0]} not found`);
  }

  // Find the target device through the hierarchy
  const targetDevice = findDeviceRecursively(rootDevice, devicePath.slice(1));
  if (!targetDevice) {
    throw new Error(`Device not found for path ${devicePath.join(':')}`);
  }

  // Connect if not already connected
  if (!node.isConnected) {
    logger.warn(`Matter: Node ${nodeId} is not connected, connecting...`);
    node.connect();
    await node.events.initialized;
    logger.info(`Matter: Node ${nodeId} connected.`);
  }

  // Handle binary device
  if (gladysFeature.type === DEVICE_FEATURE_TYPES.SWITCH.BINARY) {
    const onOff = targetDevice.clusterClients.get(OnOff.Complete.id);

    if (!onOff) {
      throw new Error('Device does not support OnOff cluster');
    }

    // Control the device
    if (value === 1) {
      await onOff.on();
    } else {
      await onOff.off();
    }
  }

  // Handle shutters
  if (gladysFeature.category === DEVICE_FEATURE_CATEGORIES.SHUTTER) {
    const windowCovering = targetDevice.clusterClients.get(WindowCovering.Complete.id);
    // Handle device feature shutter position
    if (gladysFeature.type === DEVICE_FEATURE_TYPES.SHUTTER.POSITION) {
      await windowCovering.goToLiftPercentage({
        liftPercent100thsValue: value * 100,
      });
    }
    // Handle device feature shutter state
    if (gladysFeature.type === DEVICE_FEATURE_TYPES.SHUTTER.STATE) {
      if (value === COVER_STATE.CLOSE) {
        await windowCovering.downOrClose();
      } else if (value === COVER_STATE.OPEN) {
        await windowCovering.upOrOpen();
      } else if (value === COVER_STATE.STOP) {
        await windowCovering.stopMotion();
      }
    }
  }

  // Handle light level
  if (
    gladysFeature.category === DEVICE_FEATURE_CATEGORIES.LIGHT &&
    gladysFeature.type === DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS
  ) {
    const levelControl = targetDevice.clusterClients.get(LevelControl.Complete.id);
    const onOff = targetDevice.clusterClients.get(OnOff.Complete.id);
    await levelControl.moveToLevel({
      level: value,
      transitionTime: null,
      optionsMask: {
        coupleColorTempToLevel: false,
        executeIfOff: true,
      },
      optionsOverride: {},
    });
    // If the value is more than 0, we need to turn on the light
    if (value > 0) {
      await onOff.on();
    }
  }

  // Handle light color
  if (
    gladysFeature.category === DEVICE_FEATURE_CATEGORIES.LIGHT &&
    gladysFeature.type === DEVICE_FEATURE_TYPES.LIGHT.COLOR
  ) {
    const colorControl = targetDevice.clusterClients.get(ColorControl.Complete.id);
    const onOff = targetDevice.clusterClients.get(OnOff.Complete.id);
    const [hue, saturation] = intToHsb(value);

    // Convert from standard HSB ranges to Matter ranges
    // Matter uses hue in range 0-254, saturation in range 0-254
    // Our HSB values are in ranges: hue (0-360), saturation (0-100), brightness (0-100)
    const matterHue = Math.round((hue / 360) * 254);
    const matterSaturation = Math.round((saturation / 100) * 254);

    await colorControl.moveToHueAndSaturation({
      hue: matterHue,
      saturation: matterSaturation,
      transitionTime: null,
      optionsMask: {
        executeIfOff: true,
      },
      optionsOverride: {},
    });
    // If the user changes the color, we needs to turn on the light
    await onOff.on();
  }

  // Handle thermostat
  if (
    gladysFeature.category === DEVICE_FEATURE_CATEGORIES.THERMOSTAT &&
    gladysFeature.type === DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE
  ) {
    const thermostat = targetDevice.clusterClients.get(Thermostat.Complete.id);
    await thermostat.setOccupiedHeatingSetpointAttribute(value * 100);
  }

  // Handle air conditioning
  if (
    gladysFeature.category === DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING &&
    gladysFeature.type === DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE
  ) {
    const thermostat = targetDevice.clusterClients.get(Thermostat.Complete.id);
    await thermostat.setOccupiedCoolingSetpointAttribute(value * 100);
  }
}

module.exports = { setValue };
