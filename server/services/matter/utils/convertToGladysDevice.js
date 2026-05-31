const {
  OnOff,
  BooleanState,
  Switch,
  OccupancySensing,
  IlluminanceMeasurement,
  TemperatureMeasurement,
  WindowCovering,
  LevelControl,
  ColorControl,
  RelativeHumidityMeasurement,
  Thermostat,
  Pm25ConcentrationMeasurement,
  Pm10ConcentrationMeasurement,
  ConcentrationMeasurement,
  TotalVolatileOrganicCompoundsConcentrationMeasurement,
  FormaldehydeConcentrationMeasurement,
  ElectricalPowerMeasurement,
  ElectricalEnergyMeasurement,
  HepaFilterMonitoring,
  MediaPlayback,
  KeypadInput,
  // eslint-disable-next-line import/no-unresolved
} = require('@matter/main/clusters');
const Promise = require('bluebird');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_UNITS } = require('../../../utils/constants');
const { slugify } = require('../../../utils/slugify');

/**
 * @description Convert the Matter measurement unit attribute to Gladys attribute.
 * @param {any} measurementUnit - Attribute sent by Matter.
 * @example const deviceFeatureUnit = convertMeasurementUnitToDeviceFeatureUnits(measurementUnit);
 * @returns {string} The device feature unit.
 */
function convertMeasurementUnitToDeviceFeatureUnits(measurementUnit) {
  if (measurementUnit !== undefined && measurementUnit !== null) {
    switch (measurementUnit) {
      case ConcentrationMeasurement.MeasurementUnit.Ppm:
        return DEVICE_FEATURE_UNITS.PPM;
      case ConcentrationMeasurement.MeasurementUnit.Ppb:
        return DEVICE_FEATURE_UNITS.PPB;
      case ConcentrationMeasurement.MeasurementUnit.Ppt:
        return DEVICE_FEATURE_UNITS.PPT;
      case ConcentrationMeasurement.MeasurementUnit.Mgm3:
        return DEVICE_FEATURE_UNITS.MILLIGRAM_PER_CUBIC_METER;
      case ConcentrationMeasurement.MeasurementUnit.Ugm3:
        return DEVICE_FEATURE_UNITS.MICROGRAM_PER_CUBIC_METER;
      case ConcentrationMeasurement.MeasurementUnit.Ngm3:
        return DEVICE_FEATURE_UNITS.NANOGRAM_PER_CUBIC_METER;
      case ConcentrationMeasurement.MeasurementUnit.Pm3:
        return DEVICE_FEATURE_UNITS.PARTICLES_PER_CUBIC_METER;
      case ConcentrationMeasurement.MeasurementUnit.Bqm3:
        return DEVICE_FEATURE_UNITS.BECQUEREL_PER_CUBIC_METER;
      default:
        return DEVICE_FEATURE_UNITS.MICROGRAM_PER_CUBIC_METER;
    }
  }
  return DEVICE_FEATURE_UNITS.MICROGRAM_PER_CUBIC_METER;
}

/**
 * @description Read LevelControl min/max attributes with safe fallbacks.
 * @param {object} clusterClient - The LevelControl cluster client.
 * @param {number} defaultMin - Fallback min level.
 * @param {number} defaultMax - Fallback max level.
 * @example const { minLevel, maxLevel } = await getLevelControlMinMax(clusterClient);
 * @returns {Promise<{ minLevel: number, maxLevel: number }>} The min and max levels.
 */
async function getLevelControlMinMax(clusterClient, defaultMin = 0, defaultMax = 254) {
  let minLevel = defaultMin;
  let maxLevel = defaultMax;
  try {
    minLevel = (await clusterClient.getMinLevelAttribute()) ?? defaultMin;
  } catch (error) {
    // Keep default when attribute is unavailable
  }
  try {
    maxLevel = (await clusterClient.getMaxLevelAttribute()) ?? defaultMax;
  } catch (error) {
    // Keep default when attribute is unavailable
  }
  return { minLevel, maxLevel };
}

/**
 * @description Convert a Matter device to a Gladys device.
 * @param {string} serviceId - The service ID.
 * @param {bigint} nodeId - The node ID of the device.
 * @param {object} device - The device on the node.
 * @param {object} nodeDetailDeviceDataBasicInformation - The node detail device data basic information.
 * @param {string} devicePath - The path of the device.
 * @example
 * const gladysDevice = await convertToGladysDevice(serviceId, nodeId, node, device);
 * @returns {Promise<any>} The Gladys device.
 */
async function convertToGladysDevice(serviceId, nodeId, device, nodeDetailDeviceDataBasicInformation, devicePath) {
  const gladysDevice = {
    name: device.name,
    external_id: `matter:${nodeId}:${devicePath}`,
    selector: slugify(`matter-${device.name}`, true),
    service_id: serviceId,
    should_poll: false,
    features: [],
    params: [],
  };
  if (nodeDetailDeviceDataBasicInformation) {
    gladysDevice.name = `${
      nodeDetailDeviceDataBasicInformation.vendorName
    } (${nodeDetailDeviceDataBasicInformation.nodeLabel ||
      nodeDetailDeviceDataBasicInformation.productLabel ||
      nodeDetailDeviceDataBasicInformation.productName ||
      device.name})`;
    if (nodeDetailDeviceDataBasicInformation.uniqueId) {
      gladysDevice.params.push({
        name: 'UNIQUE_ID',
        value: nodeDetailDeviceDataBasicInformation.uniqueId,
      });
    }
    if (nodeDetailDeviceDataBasicInformation.serialNumber) {
      gladysDevice.params.push({
        name: 'SERIAL_NUMBER',
        value: nodeDetailDeviceDataBasicInformation.serialNumber,
      });
    }
  }

  // Add endpoint number to the name so the user can identify the device
  gladysDevice.name += ` ${device.number}`;

  const allClusterClients = device.getAllClusterClients();
  if (allClusterClients && allClusterClients.length > 0) {
    await Promise.each(allClusterClients, async (clusterClient) => {
      const clusterIndex = clusterClient.id;
      const commonNewFeature = {
        name: `${clusterClient.name} - ${clusterClient.endpointId}`,
        selector: slugify(`matter-${device.name}-${clusterClient.name}`, true),
      };
      if (clusterIndex === OnOff.Complete.id) {
        gladysDevice.features.push({
          ...commonNewFeature,
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          read_only: false,
          has_feedback: true,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}`,
          min: 0,
          max: 1,
        });
      } else if (clusterIndex === BooleanState.Complete.id) {
        gladysDevice.features.push({
          ...commonNewFeature,
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          read_only: true,
          has_feedback: true,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}`,
          min: 0,
          max: 1,
        });
      } else if (clusterIndex === Switch.Complete.id) {
        gladysDevice.features.push({
          name: `${clusterClient.name} - ${clusterClient.endpointId} (Click)`,
          selector: slugify(`matter-${device.name}-${clusterClient.name}-click`, true),
          category: DEVICE_FEATURE_CATEGORIES.BUTTON,
          type: DEVICE_FEATURE_TYPES.BUTTON.CLICK,
          read_only: true,
          has_feedback: true,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}:click`,
          min: 0,
          max: 84,
        });
      } else if (clusterIndex === OccupancySensing.Complete.id) {
        gladysDevice.features.push({
          ...commonNewFeature,
          category: DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
          read_only: true,
          has_feedback: true,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}`,
          min: 0,
          max: 1,
        });
      } else if (clusterIndex === IlluminanceMeasurement.Complete.id) {
        gladysDevice.features.push({
          ...commonNewFeature,
          category: DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          read_only: true,
          has_feedback: true,
          unit: DEVICE_FEATURE_UNITS.LUX,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}`,
          min: 1,
          max: 6553,
        });
      } else if (clusterIndex === TemperatureMeasurement.Complete.id) {
        gladysDevice.features.push({
          ...commonNewFeature,
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          read_only: true,
          has_feedback: true,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}`,
          min: -100,
          max: 200,
        });
      } else if (clusterIndex === WindowCovering.Complete.id) {
        gladysDevice.features.push({
          name: `${clusterClient.name} - ${clusterClient.endpointId} (Position)`,
          selector: slugify(`matter-${device.name}-${clusterClient.name}-position`, true),
          category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
          type: DEVICE_FEATURE_TYPES.SHUTTER.POSITION,
          read_only: false,
          has_feedback: true,
          unit: DEVICE_FEATURE_UNITS.PERCENT,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}:position`,
          min: 0,
          max: 100,
        });
        gladysDevice.features.push({
          name: `${clusterClient.name} - ${clusterClient.endpointId} (State)`,
          selector: slugify(`matter-${device.name}-${clusterClient.name}-state`, true),
          category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
          type: DEVICE_FEATURE_TYPES.SHUTTER.STATE,
          read_only: false,
          has_feedback: true,
          unit: null,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}:state`,
          min: 0,
          max: 1,
        });
      } else if (clusterIndex === LevelControl.Complete.id) {
        if (clusterClient.supportedFeatures && clusterClient.supportedFeatures.lighting) {
          const { minLevel, maxLevel } = await getLevelControlMinMax(clusterClient);
          gladysDevice.features.push({
            ...commonNewFeature,
            category: DEVICE_FEATURE_CATEGORIES.LIGHT,
            type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
            read_only: false,
            has_feedback: true,
            external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}`,
            min: minLevel,
            max: maxLevel,
          });
        } else {
          const { minLevel, maxLevel } = await getLevelControlMinMax(clusterClient);
          gladysDevice.features.push({
            name: `${clusterClient.name} - ${clusterClient.endpointId} (Volume)`,
            selector: slugify(`matter-${device.name}-${clusterClient.name}-volume`, true),
            category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
            type: DEVICE_FEATURE_TYPES.TELEVISION.VOLUME,
            read_only: false,
            has_feedback: true,
            external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}:volume`,
            min: minLevel,
            max: maxLevel,
          });
        }
      } else if (clusterIndex === ColorControl.Complete.id) {
        if (clusterClient.supportedFeatures.hueSaturation) {
          gladysDevice.features.push({
            name: `${clusterClient.name} - ${clusterClient.endpointId} (Color)`,
            selector: slugify(`matter-${device.name}-${clusterClient.name}-color`, true),
            category: DEVICE_FEATURE_CATEGORIES.LIGHT,
            type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
            read_only: false,
            has_feedback: true,
            external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}:color`,
            min: 0,
            max: 6579300,
          });
        }
      } else if (clusterIndex === RelativeHumidityMeasurement.Complete.id) {
        gladysDevice.features.push({
          ...commonNewFeature,
          category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          read_only: true,
          has_feedback: true,
          unit: DEVICE_FEATURE_UNITS.PERCENT,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}`,
          min: 0,
          max: 100,
        });
      } else if (clusterIndex === Thermostat.Complete.id) {
        if (clusterClient.supportedFeatures.heating) {
          gladysDevice.features.push({
            name: `${clusterClient.name} - ${clusterClient.endpointId} (Heating)`,
            selector: slugify(`matter-${device.name}-${clusterClient.name}-heating`, true),
            category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
            type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
            read_only: false,
            has_feedback: true,
            unit: DEVICE_FEATURE_UNITS.CELSIUS,
            external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}:heating`,
            min: -100,
            max: 200,
          });
        }
        if (clusterClient.supportedFeatures.cooling) {
          gladysDevice.features.push({
            name: `${clusterClient.name} - ${clusterClient.endpointId} (Cooling)`,
            selector: slugify(`matter-${device.name}-${clusterClient.name}-cooling`, true),
            category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
            type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE,
            read_only: false,
            has_feedback: true,
            unit: DEVICE_FEATURE_UNITS.CELSIUS,
            external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}:cooling`,
            min: -100,
            max: 200,
          });
        }
      } else if (clusterIndex === Pm25ConcentrationMeasurement.Complete.id) {
        const measurementUnit = await clusterClient.getMeasurementUnitAttribute();
        const deviceFeatureUnit = convertMeasurementUnitToDeviceFeatureUnits(measurementUnit);
        const minMeasuredValue = (await clusterClient.getMinMeasuredValueAttribute()) ?? 0;
        const maxMeasuredValue = (await clusterClient.getMaxMeasuredValueAttribute()) ?? 999;
        gladysDevice.features.push({
          ...commonNewFeature,
          category: DEVICE_FEATURE_CATEGORIES.PM25_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          read_only: true,
          has_feedback: true,
          unit: deviceFeatureUnit,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}`,
          min: minMeasuredValue,
          max: maxMeasuredValue,
        });
      } else if (clusterIndex === Pm10ConcentrationMeasurement.Complete.id) {
        const measurementUnit = await clusterClient.getMeasurementUnitAttribute();
        const deviceFeatureUnit = convertMeasurementUnitToDeviceFeatureUnits(measurementUnit);
        const minMeasuredValue = (await clusterClient.getMinMeasuredValueAttribute()) ?? 0;
        const maxMeasuredValue = (await clusterClient.getMaxMeasuredValueAttribute()) ?? 999;
        gladysDevice.features.push({
          ...commonNewFeature,
          category: DEVICE_FEATURE_CATEGORIES.PM10_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          read_only: true,
          has_feedback: true,
          unit: deviceFeatureUnit,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}`,
          min: minMeasuredValue,
          max: maxMeasuredValue,
        });
      } else if (clusterIndex === TotalVolatileOrganicCompoundsConcentrationMeasurement.Complete.id) {
        gladysDevice.features.push({
          ...commonNewFeature,
          category: DEVICE_FEATURE_CATEGORIES.VOC_MATTER_INDEX_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
          read_only: true,
          has_feedback: true,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}`,
          min: 0,
          max: 100,
        });
      } else if (clusterIndex === FormaldehydeConcentrationMeasurement.Complete.id) {
        const measurementUnit = await clusterClient.getMeasurementUnitAttribute();
        const deviceFeatureUnit = convertMeasurementUnitToDeviceFeatureUnits(measurementUnit);
        const minMeasuredValue = (await clusterClient.getMinMeasuredValueAttribute()) ?? 0;
        const maxMeasuredValue = (await clusterClient.getMaxMeasuredValueAttribute()) ?? 999;
        gladysDevice.features.push({
          ...commonNewFeature,
          category: DEVICE_FEATURE_CATEGORIES.FORMALDEHYD_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          read_only: true,
          has_feedback: true,
          unit: deviceFeatureUnit,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}`,
          min: minMeasuredValue,
          max: maxMeasuredValue,
        });
      } else if (clusterIndex === ElectricalPowerMeasurement.Complete.id) {
        // Add ActivePower feature
        gladysDevice.features.push({
          name: `${clusterClient.name} - ${clusterClient.endpointId} (Power)`,
          selector: slugify(`matter-${device.name}-${clusterClient.name}-power`, true),
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
          read_only: true,
          has_feedback: true,
          unit: DEVICE_FEATURE_UNITS.WATT,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}:power`,
          min: -1000000,
          max: 1000000,
        });
        // Add Voltage feature if available
        try {
          const voltage = await clusterClient.getVoltageAttribute();
          if (voltage !== undefined) {
            gladysDevice.features.push({
              name: `${clusterClient.name} - ${clusterClient.endpointId} (Voltage)`,
              selector: slugify(`matter-${device.name}-${clusterClient.name}-voltage`, true),
              category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
              type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE,
              read_only: true,
              has_feedback: true,
              unit: DEVICE_FEATURE_UNITS.VOLT,
              external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}:voltage`,
              min: 0,
              max: 1000,
            });
          }
        } catch (error) {
          // Voltage attribute not available
        }
        // Add ActiveCurrent feature if available
        try {
          const activeCurrent = await clusterClient.getActiveCurrentAttribute();
          if (activeCurrent !== undefined) {
            gladysDevice.features.push({
              name: `${clusterClient.name} - ${clusterClient.endpointId} (Current)`,
              selector: slugify(`matter-${device.name}-${clusterClient.name}-current`, true),
              category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
              type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT,
              read_only: true,
              has_feedback: true,
              unit: DEVICE_FEATURE_UNITS.AMPERE,
              external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}:current`,
              min: 0,
              max: 1000,
            });
          }
        } catch (error) {
          // ActiveCurrent attribute not available
        }
      } else if (clusterIndex === ElectricalEnergyMeasurement.Complete.id) {
        // Check if CumulativeEnergy feature is supported
        if (clusterClient.supportedFeatures && clusterClient.supportedFeatures.cumulativeEnergy) {
          gladysDevice.features.push({
            name: `${clusterClient.name} - ${clusterClient.endpointId} (Energy)`,
            selector: slugify(`matter-${device.name}-${clusterClient.name}-energy`, true),
            category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
            type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
            read_only: true,
            has_feedback: true,
            unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
            external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}:energy`,
            min: 0,
            max: 1000000,
          });
        }
      } else if (clusterIndex === HepaFilterMonitoring.Complete.id) {
        gladysDevice.features.push({
          ...commonNewFeature,
          category: DEVICE_FEATURE_CATEGORIES.HEPA_FILTER_MONITORING,
          type: DEVICE_FEATURE_TYPES.FILTER_MONITORING.FILTER_LIFE_REMAINING,
          read_only: true,
          has_feedback: true,
          unit: DEVICE_FEATURE_UNITS.PERCENT,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}`,
          min: 0,
          max: 100,
        });
      } else if (clusterIndex === MediaPlayback.Complete.id) {
        gladysDevice.features.push({
          name: `${clusterClient.name} - ${clusterClient.endpointId} (Play)`,
          selector: slugify(`matter-${device.name}-${clusterClient.name}-play`, true),
          category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
          type: DEVICE_FEATURE_TYPES.TELEVISION.PLAY,
          read_only: false,
          has_feedback: true,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}:play`,
          min: 0,
          max: 1,
        });
        gladysDevice.features.push({
          name: `${clusterClient.name} - ${clusterClient.endpointId} (Pause)`,
          selector: slugify(`matter-${device.name}-${clusterClient.name}-pause`, true),
          category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
          type: DEVICE_FEATURE_TYPES.TELEVISION.PAUSE,
          read_only: false,
          has_feedback: true,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}:pause`,
          min: 0,
          max: 1,
        });
        gladysDevice.features.push({
          name: `${clusterClient.name} - ${clusterClient.endpointId} (Stop)`,
          selector: slugify(`matter-${device.name}-${clusterClient.name}-stop`, true),
          category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
          type: DEVICE_FEATURE_TYPES.TELEVISION.STOP,
          read_only: false,
          has_feedback: true,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}:stop`,
          min: 0,
          max: 1,
        });
      } else if (clusterIndex === KeypadInput.Complete.id) {
        gladysDevice.features.push({
          name: `${clusterClient.name} - ${clusterClient.endpointId} (Up)`,
          selector: slugify(`matter-${device.name}-${clusterClient.name}-up`, true),
          category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
          type: DEVICE_FEATURE_TYPES.TELEVISION.UP,
          read_only: false,
          has_feedback: true,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}:up`,
          min: 0,
          max: 1,
        });
        gladysDevice.features.push({
          name: `${clusterClient.name} - ${clusterClient.endpointId} (Down)`,
          selector: slugify(`matter-${device.name}-${clusterClient.name}-down`, true),
          category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
          type: DEVICE_FEATURE_TYPES.TELEVISION.DOWN,
          read_only: false,
          has_feedback: true,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}:down`,
          min: 0,
          max: 1,
        });
        gladysDevice.features.push({
          name: `${clusterClient.name} - ${clusterClient.endpointId} (Left)`,
          selector: slugify(`matter-${device.name}-${clusterClient.name}-left`, true),
          category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
          type: DEVICE_FEATURE_TYPES.TELEVISION.LEFT,
          read_only: false,
          has_feedback: true,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}:left`,
          min: 0,
          max: 1,
        });
        gladysDevice.features.push({
          name: `${clusterClient.name} - ${clusterClient.endpointId} (Right)`,
          selector: slugify(`matter-${device.name}-${clusterClient.name}-right`, true),
          category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
          type: DEVICE_FEATURE_TYPES.TELEVISION.RIGHT,
          read_only: false,
          has_feedback: true,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}:right`,
          min: 0,
          max: 1,
        });
        gladysDevice.features.push({
          name: `${clusterClient.name} - ${clusterClient.endpointId} (Enter)`,
          selector: slugify(`matter-${device.name}-${clusterClient.name}-enter`, true),
          category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
          type: DEVICE_FEATURE_TYPES.TELEVISION.ENTER,
          read_only: false,
          has_feedback: true,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}:enter`,
          min: 0,
          max: 1,
        });
        gladysDevice.features.push({
          name: `${clusterClient.name} - ${clusterClient.endpointId} (Return)`,
          selector: slugify(`matter-${device.name}-${clusterClient.name}-return`, true),
          category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
          type: DEVICE_FEATURE_TYPES.TELEVISION.RETURN,
          read_only: false,
          has_feedback: true,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}:return`,
          min: 0,
          max: 1,
        });
      }
    });
  }
  return gladysDevice;
}

module.exports = {
  convertToGladysDevice,
  convertMeasurementUnitToDeviceFeatureUnits,
};
