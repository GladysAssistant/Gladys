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
  Pm10ConcentrationMeasurement,
  TotalVolatileOrganicCompoundsConcentrationMeasurement,
  FormaldehydeConcentrationMeasurement,
  ElectricalPowerMeasurement,
  ElectricalEnergyMeasurement,
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
  // OnOff
  const onOff = device.getClusterClientById(OnOff.Complete.id);
  if (onOff) {
    try {
      const cached = await onOff.attributes.onOff.get(false);
      if (cached !== undefined && cached !== null) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${OnOff.Complete.id}`,
          state: cached ? STATE.ON : STATE.OFF,
        });
      }
    } catch (e) {
      logger.debug(`Matter: No cached OnOff state for ${devicePath}`);
    }
    if (!this.stateChangeListeners.has(onOff)) {
      logger.debug(`Matter: Adding state change listener for OnOff cluster ${onOff.name}`);
      this.stateChangeListeners.add(onOff);
      onOff.addOnOffAttributeListener((value) => {
        logger.debug(`Matter: OnOff attribute changed to ${value}`);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${OnOff.Complete.id}`,
          state: value ? STATE.ON : STATE.OFF,
        });
      });
    }
  }

  // OccupancySensing
  const occupancy = device.getClusterClientById(OccupancySensing.Complete.id);
  if (occupancy) {
    try {
      const cached = await occupancy.attributes.occupancy.get(false);
      if (cached !== undefined && cached !== null) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${OccupancySensing.Complete.id}`,
          state: cached.occupied ? STATE.ON : STATE.OFF,
        });
      }
    } catch (e) {
      logger.debug(`Matter: No cached OccupancySensing state for ${devicePath}`);
    }
    if (!this.stateChangeListeners.has(occupancy)) {
      logger.debug(`Matter: Adding state change listener for OccupancySensing cluster ${occupancy.name}`);
      this.stateChangeListeners.add(occupancy);
      occupancy.addOccupancyAttributeListener((value) => {
        logger.debug(`Matter: Occupancy attribute changed to ${value}`);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${OccupancySensing.Complete.id}`,
          state: value.occupied ? STATE.ON : STATE.OFF,
        });
      });
    }
  }

  // IlluminanceMeasurement
  const illuminance = device.getClusterClientById(IlluminanceMeasurement.Complete.id);
  if (illuminance) {
    try {
      const cached = await illuminance.attributes.measuredValue.get(false);
      if (cached !== undefined && cached !== null) {
        const luxValue = Math.round(10 ** ((cached - 1) / 10000));
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${IlluminanceMeasurement.Complete.id}`,
          state: luxValue,
        });
      }
    } catch (e) {
      logger.debug(`Matter: No cached IlluminanceMeasurement state for ${devicePath}`);
    }
    if (!this.stateChangeListeners.has(illuminance)) {
      logger.debug(`Matter: Adding state change listener for IlluminanceMeasurement cluster ${illuminance.name}`);
      this.stateChangeListeners.add(illuminance);
      illuminance.addMeasuredValueAttributeListener((value) => {
        const luxValue = Math.round(10 ** ((value - 1) / 10000));
        logger.debug(`Matter: Illuminance attribute changed to ${value} (Converted to ${luxValue} lux)`);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${IlluminanceMeasurement.Complete.id}`,
          state: luxValue,
        });
      });
    }
  }

  // TemperatureMeasurement
  const temperatureSensor = device.getClusterClientById(TemperatureMeasurement.Complete.id);
  if (temperatureSensor) {
    try {
      const cached = await temperatureSensor.attributes.measuredValue.get(false);
      if (cached !== undefined && cached !== null) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${TemperatureMeasurement.Complete.id}`,
          state: cached / 100,
        });
      }
    } catch (e) {
      logger.debug(`Matter: No cached TemperatureMeasurement state for ${devicePath}`);
    }
    if (!this.stateChangeListeners.has(temperatureSensor)) {
      logger.debug(`Matter: Adding state change listener for TemperatureMeasurement cluster ${temperatureSensor.name}`);
      this.stateChangeListeners.add(temperatureSensor);
      temperatureSensor.addMeasuredValueAttributeListener((value) => {
        logger.debug(`Matter: Temperature attribute changed to ${value}`);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${TemperatureMeasurement.Complete.id}`,
          state: value / 100,
        });
      });
    }
  }

  // WindowCovering
  const windowCover = device.getClusterClientById(WindowCovering.Complete.id);
  if (windowCover) {
    try {
      const cached = await windowCover.attributes.currentPositionLiftPercent100ths.get(false);
      if (cached !== undefined && cached !== null) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${WindowCovering.Complete.id}:position`,
          state: cached / 100,
        });
      }
    } catch (e) {
      logger.debug(`Matter: No cached WindowCovering state for ${devicePath}`);
    }
    if (!this.stateChangeListeners.has(windowCover)) {
      logger.debug(`Matter: Adding state change listener for WindowCovering cluster ${windowCover.name}`);
      this.stateChangeListeners.add(windowCover);
      windowCover.addCurrentPositionLiftPercent100thsAttributeListener((value) => {
        logger.debug(`Matter: WindowCovering attribute changed to ${value}`);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${WindowCovering.Complete.id}:position`,
          state: value / 100,
        });
      });
    }
  }

  // LevelControl
  const levelControl = device.getClusterClientById(LevelControl.Complete.id);
  if (levelControl) {
    try {
      const cached = await levelControl.attributes.currentLevel.get(false);
      if (cached !== undefined && cached !== null) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${LevelControl.Complete.id}`,
          state: cached,
        });
      }
    } catch (e) {
      logger.debug(`Matter: No cached LevelControl state for ${devicePath}`);
    }
    if (!this.stateChangeListeners.has(levelControl)) {
      logger.debug(`Matter: Adding state change listener for LevelControl cluster ${levelControl.name}`);
      this.stateChangeListeners.add(levelControl);
      levelControl.addCurrentLevelAttributeListener((value) => {
        logger.debug(`Matter: LevelControl attribute changed to ${value}`);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${LevelControl.Complete.id}`,
          state: value,
        });
      });
    }
  }

  // ColorControl
  const colorControl = device.getClusterClientById(ColorControl.Complete.id);
  if (colorControl) {
    const emitColorState = async () => {
      try {
        const currentHue = await colorControl.attributes.currentHue.get(false);
        const currentSaturation = await colorControl.attributes.currentSaturation.get(false);
        if (currentHue === undefined || currentHue === null || currentSaturation === undefined || currentSaturation === null) {
          return;
        }
        logger.debug(`Matter: Emitting color state hue=${currentHue} sat=${currentSaturation}`);
        const hue = Math.round((currentHue / 254) * 360);
        const saturation = Math.round((currentSaturation / 254) * 100);
        const rgb = hsbToRgb([hue, saturation, 100]);
        const intColor = rgbToInt(rgb);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${ColorControl.Complete.id}:color`,
          state: intColor,
        });
      } catch (e) {
        logger.debug(`Matter: No cached ColorControl state for ${devicePath}`);
      }
    };
    await emitColorState();
    if (!this.stateChangeListeners.has(colorControl)) {
      logger.debug(`Matter: Adding state change listener for ColorControl cluster ${colorControl.name}`);
      this.stateChangeListeners.add(colorControl);
      if (colorControl.supportedFeatures.hueSaturation) {
        colorControl.addCurrentHueAttributeListener(() => { emitColorState(); });
        colorControl.addCurrentSaturationAttributeListener(() => { emitColorState(); });
      }
    }
  }

  // RelativeHumidityMeasurement
  const relativeHumidityMeasurement = device.getClusterClientById(RelativeHumidityMeasurement.Complete.id);
  if (relativeHumidityMeasurement) {
    try {
      const cached = await relativeHumidityMeasurement.attributes.measuredValue.get(false);
      if (cached !== undefined && cached !== null) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${RelativeHumidityMeasurement.Complete.id}`,
          state: cached / 100,
        });
      }
    } catch (e) {
      logger.debug(`Matter: No cached RelativeHumidityMeasurement state for ${devicePath}`);
    }
    if (!this.stateChangeListeners.has(relativeHumidityMeasurement)) {
      logger.debug(
        `Matter: Adding state change listener for RelativeHumidityMeasurement cluster ${relativeHumidityMeasurement.name}`,
      );
      this.stateChangeListeners.add(relativeHumidityMeasurement);
      relativeHumidityMeasurement.addMeasuredValueAttributeListener((value) => {
        logger.debug(`Matter: RelativeHumidityMeasurement attribute changed to ${value}`);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${RelativeHumidityMeasurement.Complete.id}`,
          state: value / 100,
        });
      });
    }
  }

  // Pm25ConcentrationMeasurement
  const pm25ConcentrationMeasurement = device.getClusterClientById(Pm25ConcentrationMeasurement.Complete.id);
  if (pm25ConcentrationMeasurement) {
    try {
      const cached = await pm25ConcentrationMeasurement.attributes.measuredValue.get(false);
      if (cached !== undefined && cached !== null) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${Pm25ConcentrationMeasurement.Complete.id}`,
          state: cached,
        });
      }
    } catch (e) {
      logger.debug(`Matter: No cached Pm25ConcentrationMeasurement state for ${devicePath}`);
    }
    if (!this.stateChangeListeners.has(pm25ConcentrationMeasurement)) {
      logger.debug(
        `Matter: Adding state change listener for Pm25ConcentrationMeasurement cluster ${pm25ConcentrationMeasurement.name}`,
      );
      this.stateChangeListeners.add(pm25ConcentrationMeasurement);
      pm25ConcentrationMeasurement.addMeasuredValueAttributeListener((value) => {
        logger.debug(`Matter: Pm25ConcentrationMeasurement attribute changed to ${value}`);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${Pm25ConcentrationMeasurement.Complete.id}`,
          state: value,
        });
      });
    }
  }

  // Pm10ConcentrationMeasurement
  const pm10ConcentrationMeasurement = device.getClusterClientById(Pm10ConcentrationMeasurement.Complete.id);
  if (pm10ConcentrationMeasurement) {
    try {
      const cached = await pm10ConcentrationMeasurement.attributes.measuredValue.get(false);
      if (cached !== undefined && cached !== null) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${Pm10ConcentrationMeasurement.Complete.id}`,
          state: cached,
        });
      }
    } catch (e) {
      logger.debug(`Matter: No cached Pm10ConcentrationMeasurement state for ${devicePath}`);
    }
    if (!this.stateChangeListeners.has(pm10ConcentrationMeasurement)) {
      logger.debug(
        `Matter: Adding state change listener for Pm10ConcentrationMeasurement cluster ${pm10ConcentrationMeasurement.name}`,
      );
      this.stateChangeListeners.add(pm10ConcentrationMeasurement);
      pm10ConcentrationMeasurement.addMeasuredValueAttributeListener((value) => {
        logger.debug(`Matter: Pm10ConcentrationMeasurement attribute changed to ${value}`);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${Pm10ConcentrationMeasurement.Complete.id}`,
          state: value,
        });
      });
    }
  }

  // TotalVolatileOrganicCompoundsConcentrationMeasurement
  const totalVolatileOrganicCompoundsConcentrationMeasurement = device.getClusterClientById(
    TotalVolatileOrganicCompoundsConcentrationMeasurement.Complete.id,
  );
  if (totalVolatileOrganicCompoundsConcentrationMeasurement) {
    try {
      const cached = await totalVolatileOrganicCompoundsConcentrationMeasurement.attributes.levelValue.get(false);
      if (cached !== undefined && cached !== null) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${TotalVolatileOrganicCompoundsConcentrationMeasurement.Complete.id}`,
          state: cached,
        });
      }
    } catch (e) {
      logger.debug(`Matter: No cached TVOC state for ${devicePath}`);
    }
    if (!this.stateChangeListeners.has(totalVolatileOrganicCompoundsConcentrationMeasurement)) {
      logger.debug(
        `Matter: Adding state change listener for totalVolatileOrganicCompoundsConcentrationMeasurement cluster ${totalVolatileOrganicCompoundsConcentrationMeasurement.name}`,
      );
      this.stateChangeListeners.add(totalVolatileOrganicCompoundsConcentrationMeasurement);
      totalVolatileOrganicCompoundsConcentrationMeasurement.addLevelValueAttributeListener((value) => {
        logger.debug(`Matter: TotalVolatileOrganicCompoundsConcentrationMeasurement attribute changed to ${value}`);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${TotalVolatileOrganicCompoundsConcentrationMeasurement.Complete.id}`,
          state: value,
        });
      });
    }
  }

  // FormaldehydeConcentrationMeasurement
  const formaldehydeConcentrationMeasurement = device.getClusterClientById(
    FormaldehydeConcentrationMeasurement.Complete.id,
  );
  if (formaldehydeConcentrationMeasurement) {
    try {
      const cached = await formaldehydeConcentrationMeasurement.attributes.measuredValue.get(false);
      if (cached !== undefined && cached !== null) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${FormaldehydeConcentrationMeasurement.Complete.id}`,
          state: cached,
        });
      }
    } catch (e) {
      logger.debug(`Matter: No cached FormaldehydeConcentrationMeasurement state for ${devicePath}`);
    }
    if (!this.stateChangeListeners.has(formaldehydeConcentrationMeasurement)) {
      logger.debug(
        `Matter: Adding state change listener for FormaldehydeConcentrationMeasurement cluster ${formaldehydeConcentrationMeasurement.name}`,
      );
      this.stateChangeListeners.add(formaldehydeConcentrationMeasurement);
      formaldehydeConcentrationMeasurement.addMeasuredValueAttributeListener((value) => {
        logger.debug(`Matter: FormaldehydeConcentrationMeasurement attribute changed to ${value}`);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${FormaldehydeConcentrationMeasurement.Complete.id}`,
          state: value,
        });
      });
    }
  }

  // Thermostat
  const thermostat = device.getClusterClientById(Thermostat.Complete.id);
  if (thermostat) {
    try {
      if (thermostat.supportedFeatures.heating) {
        const cached = await thermostat.attributes.occupiedHeatingSetpoint.get(false);
        if (cached !== undefined && cached !== null) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: `matter:${nodeId}:${devicePath}:${Thermostat.Complete.id}:heating`,
            state: cached / 100,
          });
        }
      }
      if (thermostat.supportedFeatures.cooling) {
        const cached = await thermostat.attributes.occupiedCoolingSetpoint.get(false);
        if (cached !== undefined && cached !== null) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: `matter:${nodeId}:${devicePath}:${Thermostat.Complete.id}:cooling`,
            state: cached / 100,
          });
        }
      }
    } catch (e) {
      logger.debug(`Matter: No cached Thermostat state for ${devicePath}`);
    }
    if (!this.stateChangeListeners.has(thermostat)) {
      logger.debug(`Matter: Adding state change listener for Thermostat cluster ${thermostat.name}`);
      this.stateChangeListeners.add(thermostat);
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

  // ElectricalPowerMeasurement
  const electricalPowerMeasurement = device.getClusterClientById(ElectricalPowerMeasurement.Complete.id);
  if (electricalPowerMeasurement) {
    try {
      const cachedPower = await electricalPowerMeasurement.attributes.activePower.get(false);
      if (cachedPower !== undefined && cachedPower !== null) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${ElectricalPowerMeasurement.Complete.id}:power`,
          state: cachedPower / 1000,
        });
      }
      if (electricalPowerMeasurement.attributes.voltage) {
        const cachedVoltage = await electricalPowerMeasurement.attributes.voltage.get(false);
        if (cachedVoltage !== undefined && cachedVoltage !== null) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: `matter:${nodeId}:${devicePath}:${ElectricalPowerMeasurement.Complete.id}:voltage`,
            state: cachedVoltage / 1000,
          });
        }
      }
      if (electricalPowerMeasurement.attributes.activeCurrent) {
        const cachedCurrent = await electricalPowerMeasurement.attributes.activeCurrent.get(false);
        if (cachedCurrent !== undefined && cachedCurrent !== null) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: `matter:${nodeId}:${devicePath}:${ElectricalPowerMeasurement.Complete.id}:current`,
            state: cachedCurrent / 1000,
          });
        }
      }
    } catch (e) {
      logger.debug(`Matter: No cached ElectricalPowerMeasurement state for ${devicePath}`);
    }
    if (!this.stateChangeListeners.has(electricalPowerMeasurement)) {
      logger.debug(
        `Matter: Adding state change listener for ElectricalPowerMeasurement cluster ${electricalPowerMeasurement.name}`,
      );
      this.stateChangeListeners.add(electricalPowerMeasurement);
      electricalPowerMeasurement.addActivePowerAttributeListener((value) => {
        logger.debug(`Matter: ElectricalPowerMeasurement ActivePower attribute changed to ${value}`);
        const powerInWatts = value !== null ? value / 1000 : null;
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${ElectricalPowerMeasurement.Complete.id}:power`,
          state: powerInWatts,
        });
      });
      if (electricalPowerMeasurement.addVoltageAttributeListener) {
        electricalPowerMeasurement.addVoltageAttributeListener((value) => {
          logger.debug(`Matter: ElectricalPowerMeasurement Voltage attribute changed to ${value}`);
          const voltageInVolts = value !== null ? value / 1000 : null;
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: `matter:${nodeId}:${devicePath}:${ElectricalPowerMeasurement.Complete.id}:voltage`,
            state: voltageInVolts,
          });
        });
      }
      if (electricalPowerMeasurement.addActiveCurrentAttributeListener) {
        electricalPowerMeasurement.addActiveCurrentAttributeListener((value) => {
          logger.debug(`Matter: ElectricalPowerMeasurement ActiveCurrent attribute changed to ${value}`);
          const currentInAmps = value !== null ? value / 1000 : null;
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: `matter:${nodeId}:${devicePath}:${ElectricalPowerMeasurement.Complete.id}:current`,
            state: currentInAmps,
          });
        });
      }
    }
  }

  // ElectricalEnergyMeasurement
  const electricalEnergyMeasurement = device.getClusterClientById(ElectricalEnergyMeasurement.Complete.id);
  if (electricalEnergyMeasurement) {
    try {
      if (electricalEnergyMeasurement.attributes.cumulativeEnergyImported) {
        const cached = await electricalEnergyMeasurement.attributes.cumulativeEnergyImported.get(false);
        if (cached !== undefined && cached !== null && cached.energy !== null) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: `matter:${nodeId}:${devicePath}:${ElectricalEnergyMeasurement.Complete.id}:energy`,
            state: cached.energy / 1000000,
          });
        }
      }
    } catch (e) {
      logger.debug(`Matter: No cached ElectricalEnergyMeasurement state for ${devicePath}`);
    }
    if (!this.stateChangeListeners.has(electricalEnergyMeasurement)) {
      logger.debug(
        `Matter: Adding state change listener for ElectricalEnergyMeasurement cluster ${electricalEnergyMeasurement.name}`,
      );
      this.stateChangeListeners.add(electricalEnergyMeasurement);
      if (electricalEnergyMeasurement.addCumulativeEnergyImportedAttributeListener) {
        electricalEnergyMeasurement.addCumulativeEnergyImportedAttributeListener((value) => {
          logger.debug(`Matter: ElectricalEnergyMeasurement CumulativeEnergyImported attribute changed to`, value);
          const energyInKwh = value && value.energy !== null ? value.energy / 1000000 : null;
          const externalId = `matter:${nodeId}:${devicePath}:${ElectricalEnergyMeasurement.Complete.id}:energy`;
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: externalId,
            state: energyInKwh,
          });
        });
      }
    }
  }
}

module.exports = {
  listenToStateChange,
};
