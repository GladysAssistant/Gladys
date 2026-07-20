const {
  OnOff,
  BooleanState,
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

const logger = require('../../../utils/logger');
const { matterFanModeToGladys, matterAttributeToNumber } = require('../utils/fanMatterMapping');
const { hsbToRgb, rgbToInt } = require('../../../utils/colors');
const { EVENTS, STATE } = require('../../../utils/constants');
const {
  convertMatterOperationalStateToGladys,
  convertMatterRunModeToGladys,
  convertMatterCleanModeToGladys,
} = require('../utils/vacuumCleanerStateMapping');

/**
 * @description Read an attribute and ignore errors when the device does not expose it.
 * @param {Function} readAttribute - Async function that reads the attribute.
 * @returns {Promise<any|undefined>} Attribute value or undefined.
 * @example
 * const value = await safeReadAttribute(() => onOff.getOnOffAttribute());
 */
async function safeReadAttribute(readAttribute) {
  try {
    return await readAttribute();
  } catch (error) {
    logger.debug(`Matter: Could not read initial attribute: ${error.message}`);
    return undefined;
  }
}

/**
 * @description Read current Matter attribute values and emit them as Gladys states.
 * @param {bigint} nodeId - The node ID of the device.
 * @param {string} devicePath - The path of the device.
 * @param {object} device - The device object.
 * @example
 * await matter.readInitialDeviceStates(nodeId, devicePath, device);
 */
async function readInitialDeviceStates(nodeId, devicePath, device) {
  const emitState = (deviceFeatureExternalId, state) => {
    if (state !== null && state !== undefined) {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: deviceFeatureExternalId,
        state,
      });
    }
  };

  const onOff = device.getClusterClientById(OnOff.Complete.id);
  if (onOff) {
    const value = await safeReadAttribute(() => onOff.getOnOffAttribute());
    if (value !== undefined) {
      emitState(`matter:${nodeId}:${devicePath}:${OnOff.Complete.id}`, value ? STATE.ON : STATE.OFF);
    }
  }

  const booleanState = device.getClusterClientById(BooleanState.Complete.id);
  if (booleanState) {
    const value = await safeReadAttribute(() => booleanState.getStateValueAttribute());
    if (value !== undefined) {
      emitState(`matter:${nodeId}:${devicePath}:${BooleanState.Complete.id}`, value ? STATE.ON : STATE.OFF);
    }
  }

  const occupancy = device.getClusterClientById(OccupancySensing.Complete.id);
  if (occupancy) {
    const value = await safeReadAttribute(() => occupancy.getOccupancyAttribute());
    if (value) {
      emitState(
        `matter:${nodeId}:${devicePath}:${OccupancySensing.Complete.id}`,
        value.occupied ? STATE.ON : STATE.OFF,
      );
    }
  }

  const illuminance = device.getClusterClientById(IlluminanceMeasurement.Complete.id);
  if (illuminance) {
    const value = await safeReadAttribute(() => illuminance.getMeasuredValueAttribute());
    if (value !== undefined) {
      emitState(
        `matter:${nodeId}:${devicePath}:${IlluminanceMeasurement.Complete.id}`,
        Math.round(10 ** ((value - 1) / 10000)),
      );
    }
  }

  const temperatureSensor = device.getClusterClientById(TemperatureMeasurement.Complete.id);
  if (temperatureSensor) {
    const value = await safeReadAttribute(() => temperatureSensor.getMeasuredValueAttribute());
    if (value !== null && value !== undefined) {
      emitState(`matter:${nodeId}:${devicePath}:${TemperatureMeasurement.Complete.id}`, value / 100);
    }
  }

  const windowCover = device.getClusterClientById(WindowCovering.Complete.id);
  if (windowCover) {
    const value = await safeReadAttribute(() => windowCover.getCurrentPositionLiftPercent100thsAttribute());
    if (value !== undefined) {
      emitState(`matter:${nodeId}:${devicePath}:${WindowCovering.Complete.id}:position`, value / 100);
    }
  }

  const levelControl = device.getClusterClientById(LevelControl.Complete.id);
  if (levelControl) {
    const value = await safeReadAttribute(() => levelControl.getCurrentLevelAttribute());
    emitState(`matter:${nodeId}:${devicePath}:${LevelControl.Complete.id}`, value);
  }

  const colorControl = device.getClusterClientById(ColorControl.Complete.id);
  if (colorControl && colorControl.supportedFeatures.hueSaturation) {
    const currentHue = await safeReadAttribute(() => colorControl.getCurrentHueAttribute());
    const currentSaturation = await safeReadAttribute(() => colorControl.getCurrentSaturationAttribute());
    if (currentHue !== undefined && currentSaturation !== undefined) {
      const hue = Math.round((currentHue / 254) * 360);
      const saturation = Math.round((currentSaturation / 254) * 100);
      const rgb = hsbToRgb([hue, saturation, 100]);
      emitState(`matter:${nodeId}:${devicePath}:${ColorControl.Complete.id}:color`, rgbToInt(rgb));
    }
  }

  const relativeHumidityMeasurement = device.getClusterClientById(RelativeHumidityMeasurement.Complete.id);
  if (relativeHumidityMeasurement) {
    const value = await safeReadAttribute(() => relativeHumidityMeasurement.getMeasuredValueAttribute());
    if (value !== undefined) {
      emitState(`matter:${nodeId}:${devicePath}:${RelativeHumidityMeasurement.Complete.id}`, value / 100);
    }
  }

  const pm25ConcentrationMeasurement = device.getClusterClientById(Pm25ConcentrationMeasurement.Complete.id);
  if (pm25ConcentrationMeasurement) {
    const value = await safeReadAttribute(() => pm25ConcentrationMeasurement.getMeasuredValueAttribute());
    emitState(`matter:${nodeId}:${devicePath}:${Pm25ConcentrationMeasurement.Complete.id}`, value);
  }

  const pm10ConcentrationMeasurement = device.getClusterClientById(Pm10ConcentrationMeasurement.Complete.id);
  if (pm10ConcentrationMeasurement) {
    const value = await safeReadAttribute(() => pm10ConcentrationMeasurement.getMeasuredValueAttribute());
    emitState(`matter:${nodeId}:${devicePath}:${Pm10ConcentrationMeasurement.Complete.id}`, value);
  }

  const totalVolatileOrganicCompoundsConcentrationMeasurement = device.getClusterClientById(
    TotalVolatileOrganicCompoundsConcentrationMeasurement.Complete.id,
  );
  if (totalVolatileOrganicCompoundsConcentrationMeasurement) {
    const value = await safeReadAttribute(() =>
      totalVolatileOrganicCompoundsConcentrationMeasurement.getLevelValueAttribute(),
    );
    emitState(
      `matter:${nodeId}:${devicePath}:${TotalVolatileOrganicCompoundsConcentrationMeasurement.Complete.id}`,
      value,
    );
  }

  const nitrogenDioxideConcentrationMeasurement = device.getClusterClientById(
    NitrogenDioxideConcentrationMeasurement.Complete.id,
  );
  if (nitrogenDioxideConcentrationMeasurement) {
    const value = await safeReadAttribute(() => nitrogenDioxideConcentrationMeasurement.getLevelValueAttribute());
    emitState(`matter:${nodeId}:${devicePath}:${NitrogenDioxideConcentrationMeasurement.Complete.id}`, value);
  }

  const formaldehydeConcentrationMeasurement = device.getClusterClientById(
    FormaldehydeConcentrationMeasurement.Complete.id,
  );
  if (formaldehydeConcentrationMeasurement) {
    const value = await safeReadAttribute(() => formaldehydeConcentrationMeasurement.getMeasuredValueAttribute());
    emitState(`matter:${nodeId}:${devicePath}:${FormaldehydeConcentrationMeasurement.Complete.id}`, value);
  }

  const thermostat = device.getClusterClientById(Thermostat.Complete.id);
  if (thermostat) {
    const localTemperature = await safeReadAttribute(() => thermostat.getLocalTemperatureAttribute());
    if (localTemperature !== null && localTemperature !== undefined) {
      emitState(`matter:${nodeId}:${devicePath}:${Thermostat.Complete.id}:local-temperature`, localTemperature / 100);
    }
    if (thermostat.supportedFeatures.heating) {
      const value = await safeReadAttribute(() => thermostat.getOccupiedHeatingSetpointAttribute());
      if (value !== undefined) {
        emitState(`matter:${nodeId}:${devicePath}:${Thermostat.Complete.id}:heating`, value / 100);
      }
    }
    if (thermostat.supportedFeatures.cooling) {
      const value = await safeReadAttribute(() => thermostat.getOccupiedCoolingSetpointAttribute());
      if (value !== undefined) {
        emitState(`matter:${nodeId}:${devicePath}:${Thermostat.Complete.id}:cooling`, value / 100);
      }
    }
  }

  const electricalPowerMeasurement = device.getClusterClientById(ElectricalPowerMeasurement.Complete.id);
  if (electricalPowerMeasurement) {
    const activePower = await safeReadAttribute(() => electricalPowerMeasurement.getActivePowerAttribute());
    if (activePower !== undefined) {
      emitState(
        `matter:${nodeId}:${devicePath}:${ElectricalPowerMeasurement.Complete.id}:power`,
        activePower !== null ? activePower / 1000 : null,
      );
    }
    const voltage = await safeReadAttribute(() => electricalPowerMeasurement.getVoltageAttribute());
    if (voltage !== undefined) {
      emitState(
        `matter:${nodeId}:${devicePath}:${ElectricalPowerMeasurement.Complete.id}:voltage`,
        voltage !== null ? voltage / 1000 : null,
      );
    }
    const activeCurrent = await safeReadAttribute(() => electricalPowerMeasurement.getActiveCurrentAttribute());
    if (activeCurrent !== undefined) {
      emitState(
        `matter:${nodeId}:${devicePath}:${ElectricalPowerMeasurement.Complete.id}:current`,
        activeCurrent !== null ? activeCurrent / 1000 : null,
      );
    }
  }

  const electricalEnergyMeasurement = device.getClusterClientById(ElectricalEnergyMeasurement.Complete.id);
  if (electricalEnergyMeasurement) {
    const value = await safeReadAttribute(() => electricalEnergyMeasurement.getCumulativeEnergyImportedAttribute());
    if (value !== undefined) {
      emitState(
        `matter:${nodeId}:${devicePath}:${ElectricalEnergyMeasurement.Complete.id}:energy`,
        value && value.energy !== null ? value.energy / 1000000 : null,
      );
    }
  }

  const hepaFilterMonitoring = device.getClusterClientById(HepaFilterMonitoring.Complete.id);
  if (hepaFilterMonitoring) {
    const value = await safeReadAttribute(() => hepaFilterMonitoring.getConditionAttribute());
    emitState(`matter:${nodeId}:${devicePath}:${HepaFilterMonitoring.Complete.id}`, value);
  }

  const fanControl = device.getClusterClientById(FanControl.Complete.id);
  if (fanControl) {
    const fanBaseExternalId = `matter:${nodeId}:${devicePath}:${FanControl.Complete.id}`;
    const fanMode = await safeReadAttribute(() => fanControl.getFanModeAttribute());
    if (fanMode !== undefined) {
      emitState(`${fanBaseExternalId}:mode`, matterFanModeToGladys(fanMode));
    }

    const percentSetting = await safeReadAttribute(() => fanControl.getPercentSettingAttribute());
    if (percentSetting !== null && percentSetting !== undefined) {
      emitState(`${fanBaseExternalId}:percent`, percentSetting);
    }

    const percentCurrent = await safeReadAttribute(() => fanControl.getPercentCurrentAttribute());
    emitState(`${fanBaseExternalId}:percent-current`, percentCurrent);

    if (fanControl.supportedFeatures.multiSpeed) {
      const speedSetting = await safeReadAttribute(() => fanControl.getSpeedSettingAttribute());
      if (speedSetting !== null && speedSetting !== undefined) {
        emitState(`${fanBaseExternalId}:speed`, speedSetting);
      }
      const speedCurrent = await safeReadAttribute(() => fanControl.getSpeedCurrentAttribute());
      emitState(`${fanBaseExternalId}:speed-current`, speedCurrent);
    }

    if (fanControl.supportedFeatures.rocking) {
      const rockSetting = await safeReadAttribute(() => fanControl.getRockSettingAttribute());
      if (rockSetting !== undefined) {
        emitState(
          `${fanBaseExternalId}:rock`,
          matterAttributeToNumber(rockSetting, FanControl.Complete.attributes.rockSetting.schema),
        );
      }
    }

    if (fanControl.supportedFeatures.wind) {
      const windSetting = await safeReadAttribute(() => fanControl.getWindSettingAttribute());
      if (windSetting !== undefined) {
        emitState(
          `${fanBaseExternalId}:wind`,
          matterAttributeToNumber(windSetting, FanControl.Complete.attributes.windSetting.schema),
        );
      }
    }

    if (fanControl.supportedFeatures.airflowDirection) {
      const airflowDirection = await safeReadAttribute(() => fanControl.getAirflowDirectionAttribute());
      emitState(`${fanBaseExternalId}:airflow-direction`, airflowDirection);
    }
  }

  const rvcOperationalState = device.getClusterClientById(RvcOperationalState.Complete.id);
  if (rvcOperationalState) {
    const value = await safeReadAttribute(() => rvcOperationalState.getOperationalStateAttribute());
    if (value !== undefined) {
      emitState(
        `matter:${nodeId}:${devicePath}:${RvcOperationalState.Complete.id}:state`,
        convertMatterOperationalStateToGladys(value),
      );
    }
  }

  const rvcRunMode = device.getClusterClientById(RvcRunMode.Complete.id);
  if (rvcRunMode) {
    const runModeExternalId = `matter:${nodeId}:${devicePath}:${RvcRunMode.Complete.id}`;
    const value = await safeReadAttribute(() => rvcRunMode.getCurrentModeAttribute());
    if (value !== undefined) {
      emitState(runModeExternalId, convertMatterRunModeToGladys(value, this.supportedModesMap.get(runModeExternalId)));
    }
  }

  const rvcCleanMode = device.getClusterClientById(RvcCleanMode.Complete.id);
  if (rvcCleanMode) {
    const cleanModeExternalId = `matter:${nodeId}:${devicePath}:${RvcCleanMode.Complete.id}`;
    const value = await safeReadAttribute(() => rvcCleanMode.getCurrentModeAttribute());
    if (value !== undefined) {
      emitState(
        cleanModeExternalId,
        convertMatterCleanModeToGladys(value, this.supportedModesMap.get(cleanModeExternalId)),
      );
    }
  }

  const powerSource = device.getClusterClientById(PowerSource.Complete.id);
  if (powerSource) {
    const value = await safeReadAttribute(() => powerSource.getBatPercentRemainingAttribute());
    if (value !== undefined) {
      emitState(
        `matter:${nodeId}:${devicePath}:${PowerSource.Complete.id}:battery`,
        value !== null ? Math.round(value / 2) : null,
      );
    }
  }
}

module.exports = {
  readInitialDeviceStates,
};
