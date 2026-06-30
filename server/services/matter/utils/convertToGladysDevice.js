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
  NitrogenDioxideConcentrationMeasurement,
  FormaldehydeConcentrationMeasurement,
  ElectricalPowerMeasurement,
  ElectricalEnergyMeasurement,
  HepaFilterMonitoring,
  FanControl,
  RvcOperationalState,
  RvcRunMode,
  RvcCleanMode,
  PowerSource,
  // eslint-disable-next-line import/no-unresolved
} = require('@matter/main/clusters');
const Promise = require('bluebird');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  FAN_MODE,
  FAN_AIRFLOW_DIRECTION,
  FAN_ROCK_SETTING,
  FAN_WIND_SETTING,
} = require('../../../utils/constants');
const { slugify } = require('../../../utils/slugify');
const { matterAttributeToNumber } = require('./fanMatterMapping');

/**
 * @description Build a stable Gladys selector from a Matter external_id.
 * @param {string} externalId - Matter external_id.
 * @returns {string} Gladys selector.
 * @example
 * const selector = matterExternalIdToSelector('matter:12345:1:514:mode');
 */
function matterExternalIdToSelector(externalId) {
  return slugify(externalId.replace(/:/g, '-'), false);
}

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
          category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
          type: DEVICE_FEATURE_TYPES.SHUTTER.STATE,
          read_only: false,
          has_feedback: true,
          unit: null,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}:state`,
          min: 0,
          max: 1,
        });
      } else if (
        clusterIndex === LevelControl.Complete.id &&
        clusterClient.supportedFeatures &&
        clusterClient.supportedFeatures.lighting
      ) {
        const minLevel = await clusterClient.getMinLevelAttribute();
        const maxLevel = await clusterClient.getMaxLevelAttribute();
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
      } else if (clusterIndex === ColorControl.Complete.id) {
        if (clusterClient.supportedFeatures.hueSaturation) {
          gladysDevice.features.push({
            name: `${clusterClient.name} - ${clusterClient.endpointId} (Color)`,
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
        gladysDevice.features.push({
          name: `${clusterClient.name} - ${clusterClient.endpointId} (Local temperature)`,
          selector: slugify(`matter-${device.name}-${clusterClient.name}-local-temperature`, true),
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          read_only: true,
          has_feedback: true,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}:local-temperature`,
          min: -100,
          max: 200,
        });
        if (clusterClient.supportedFeatures.heating) {
          gladysDevice.features.push({
            name: `${clusterClient.name} - ${clusterClient.endpointId} (Heating)`,
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
      } else if (clusterIndex === NitrogenDioxideConcentrationMeasurement.Complete.id) {
        gladysDevice.features.push({
          ...commonNewFeature,
          category: DEVICE_FEATURE_CATEGORIES.NO2_MATTER_INDEX_SENSOR,
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
      } else if (clusterIndex === FanControl.Complete.id) {
        const fanBaseExternalId = `matter:${nodeId}:${devicePath}:${clusterIndex}`;
        const features = clusterClient.supportedFeatures || {};

        gladysDevice.features.push({
          name: `${clusterClient.name} - ${clusterClient.endpointId} (Mode)`,
          category: DEVICE_FEATURE_CATEGORIES.FAN,
          type: DEVICE_FEATURE_TYPES.FAN.MODE,
          read_only: false,
          has_feedback: true,
          external_id: `${fanBaseExternalId}:mode`,
          min: FAN_MODE.OFF,
          max: FAN_MODE.AUTO,
        });

        gladysDevice.features.push({
          name: `${clusterClient.name} - ${clusterClient.endpointId} (Speed %)`,
          category: DEVICE_FEATURE_CATEGORIES.FAN,
          type: DEVICE_FEATURE_TYPES.FAN.PERCENT,
          read_only: false,
          has_feedback: true,
          unit: DEVICE_FEATURE_UNITS.PERCENT,
          external_id: `${fanBaseExternalId}:percent`,
          min: 0,
          max: 100,
        });

        gladysDevice.features.push({
          name: `${clusterClient.name} - ${clusterClient.endpointId} (Speed % current)`,
          category: DEVICE_FEATURE_CATEGORIES.FAN,
          type: DEVICE_FEATURE_TYPES.FAN.PERCENT,
          read_only: true,
          has_feedback: true,
          unit: DEVICE_FEATURE_UNITS.PERCENT,
          external_id: `${fanBaseExternalId}:percent-current`,
          min: 0,
          max: 100,
        });

        if (features.multiSpeed) {
          const speedMax =
            matterAttributeToNumber(
              await clusterClient.getSpeedMaxAttribute(),
              FanControl.Complete.attributes.speedMax.schema,
            ) ?? 255;
          gladysDevice.features.push({
            name: `${clusterClient.name} - ${clusterClient.endpointId} (Speed)`,
            category: DEVICE_FEATURE_CATEGORIES.FAN,
            type: DEVICE_FEATURE_TYPES.FAN.SPEED,
            read_only: false,
            has_feedback: true,
            external_id: `${fanBaseExternalId}:speed`,
            min: 0,
            max: speedMax,
          });
          gladysDevice.features.push({
            name: `${clusterClient.name} - ${clusterClient.endpointId} (Speed current)`,
            category: DEVICE_FEATURE_CATEGORIES.FAN,
            type: DEVICE_FEATURE_TYPES.FAN.SPEED,
            read_only: true,
            has_feedback: true,
            external_id: `${fanBaseExternalId}:speed-current`,
            min: 0,
            max: speedMax,
          });
        }

        if (features.rocking) {
          const rockSupport =
            matterAttributeToNumber(
              await clusterClient.getRockSupportAttribute(),
              FanControl.Complete.attributes.rockSupport.schema,
            ) ?? FAN_ROCK_SETTING.ALL;
          gladysDevice.features.push({
            name: `${clusterClient.name} - ${clusterClient.endpointId} (Oscillation)`,
            category: DEVICE_FEATURE_CATEGORIES.FAN,
            type: DEVICE_FEATURE_TYPES.FAN.ROCK_SETTING,
            read_only: false,
            has_feedback: true,
            external_id: `${fanBaseExternalId}:rock`,
            min: FAN_ROCK_SETTING.OFF,
            max: rockSupport,
          });
        }

        if (features.wind) {
          const windSupport =
            matterAttributeToNumber(
              await clusterClient.getWindSupportAttribute(),
              FanControl.Complete.attributes.windSupport.schema,
            ) ?? FAN_WIND_SETTING.SLEEP_AND_NATURAL;
          gladysDevice.features.push({
            name: `${clusterClient.name} - ${clusterClient.endpointId} (Wind mode)`,
            category: DEVICE_FEATURE_CATEGORIES.FAN,
            type: DEVICE_FEATURE_TYPES.FAN.WIND_SETTING,
            read_only: false,
            has_feedback: true,
            external_id: `${fanBaseExternalId}:wind`,
            min: FAN_WIND_SETTING.OFF,
            max: windSupport,
          });
        }

        if (features.airflowDirection) {
          gladysDevice.features.push({
            name: `${clusterClient.name} - ${clusterClient.endpointId} (Airflow direction)`,
            category: DEVICE_FEATURE_CATEGORIES.FAN,
            type: DEVICE_FEATURE_TYPES.FAN.AIRFLOW_DIRECTION,
            read_only: false,
            has_feedback: true,
            external_id: `${fanBaseExternalId}:airflow-direction`,
            min: FAN_AIRFLOW_DIRECTION.FORWARD,
            max: FAN_AIRFLOW_DIRECTION.REVERSE,
          });
        }
      } else if (clusterIndex === RvcOperationalState.Complete.id) {
        gladysDevice.features.push({
          name: `${clusterClient.name} - ${clusterClient.endpointId} (State)`,
          category: DEVICE_FEATURE_CATEGORIES.VACUUM_CLEANER,
          type: DEVICE_FEATURE_TYPES.VACUUM_CLEANER.STATE,
          read_only: true,
          has_feedback: true,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}:state`,
          min: 0,
          max: 255,
        });
        gladysDevice.features.push({
          name: `${clusterClient.name} - ${clusterClient.endpointId} (Dock)`,
          category: DEVICE_FEATURE_CATEGORIES.VACUUM_CLEANER,
          type: DEVICE_FEATURE_TYPES.VACUUM_CLEANER.DOCK,
          read_only: false,
          has_feedback: false,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}:dock`,
          min: 0,
          max: 1,
        });
      } else if (clusterIndex === RvcRunMode.Complete.id) {
        gladysDevice.features.push({
          ...commonNewFeature,
          category: DEVICE_FEATURE_CATEGORIES.VACUUM_CLEANER,
          type: DEVICE_FEATURE_TYPES.VACUUM_CLEANER.RUN_MODE,
          read_only: false,
          has_feedback: true,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}`,
          min: 0,
          max: 2,
        });
      } else if (clusterIndex === RvcCleanMode.Complete.id) {
        gladysDevice.features.push({
          ...commonNewFeature,
          category: DEVICE_FEATURE_CATEGORIES.VACUUM_CLEANER,
          type: DEVICE_FEATURE_TYPES.VACUUM_CLEANER.CLEAN_MODE,
          read_only: false,
          has_feedback: true,
          external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}`,
          min: 0,
          max: 6,
        });
      } else if (clusterIndex === PowerSource.Complete.id) {
        if (clusterClient.supportedFeatures && clusterClient.supportedFeatures.battery) {
          gladysDevice.features.push({
            name: `${clusterClient.name} - ${clusterClient.endpointId} (Battery)`,
            category: DEVICE_FEATURE_CATEGORIES.BATTERY,
            type: DEVICE_FEATURE_TYPES.BATTERY.INTEGER,
            read_only: true,
            has_feedback: true,
            unit: DEVICE_FEATURE_UNITS.PERCENT,
            external_id: `matter:${nodeId}:${devicePath}:${clusterIndex}:battery`,
            min: 0,
            max: 100,
          });
        }
      }
    });
  }
  gladysDevice.selector = matterExternalIdToSelector(gladysDevice.external_id);
  gladysDevice.features = gladysDevice.features.map((feature) => ({
    ...feature,
    selector: matterExternalIdToSelector(feature.external_id),
  }));
  return gladysDevice;
}

module.exports = {
  convertToGladysDevice,
  convertMeasurementUnitToDeviceFeatureUnits,
  matterExternalIdToSelector,
};
