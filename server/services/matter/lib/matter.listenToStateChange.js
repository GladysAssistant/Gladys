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
const { EVENTS, STATE, BUTTON_STATUS } = require('../../../utils/constants');
const {
  convertMatterOperationalStateToGladys,
  convertMatterRunModeToGladys,
  convertMatterCleanModeToGladys,
} = require('../utils/vacuumCleanerStateMapping');

/**
 * @description Listen to state changes of a device.
 * @param {bigint} nodeId - The node ID of the device.
 * @param {string} devicePath - The path of the device.
 * @param {object} device - The device object.
 * @example matter.listenToStateChange(nodeId, device);
 */
async function listenToStateChange(nodeId, devicePath, device) {
  // Get the OnOff cluster
  const onOff = device.getClusterClientById(OnOff.Complete.id);

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

  const booleanState = device.getClusterClientById(BooleanState.Complete.id);
  if (booleanState && !this.stateChangeListeners.has(booleanState)) {
    logger.debug(`Matter: Adding state change listener for BooleanState cluster ${booleanState.name}`);
    this.stateChangeListeners.add(booleanState);
    booleanState.addStateValueAttributeListener((value) => {
      logger.debug(`Matter: BooleanState attribute changed to ${value}`);
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `matter:${nodeId}:${devicePath}:${BooleanState.Complete.id}`,
        state: value ? STATE.ON : STATE.OFF,
      });
    });
  }

  const switchCluster = device.getClusterClientById(Switch.Complete.id);
  if (switchCluster && !this.stateChangeListeners.has(switchCluster)) {
    logger.debug(`Matter: Adding state change listener for Switch cluster ${switchCluster.name}`);
    this.stateChangeListeners.add(switchCluster);

    if (switchCluster.addInitialPressEventListener) {
      switchCluster.addInitialPressEventListener(() => {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${Switch.Complete.id}:click`,
          state: BUTTON_STATUS.INITIAL_PRESS,
        });
      });
    }

    if (switchCluster.addShortReleaseEventListener) {
      switchCluster.addShortReleaseEventListener(() => {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${Switch.Complete.id}:click`,
          state: BUTTON_STATUS.SHORT_RELEASE,
        });
      });
    }

    if (switchCluster.addLongPressEventListener) {
      switchCluster.addLongPressEventListener(() => {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${Switch.Complete.id}:click`,
          state: BUTTON_STATUS.LONG_PRESS,
        });
      });
    }

    if (switchCluster.addLongReleaseEventListener) {
      switchCluster.addLongReleaseEventListener(() => {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${Switch.Complete.id}:click`,
          state: BUTTON_STATUS.LONG_RELEASE,
        });
      });
    }
  }

  const occupancy = device.getClusterClientById(OccupancySensing.Complete.id);
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

  const illuminance = device.getClusterClientById(IlluminanceMeasurement.Complete.id);
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

  const temperatureSensor = device.getClusterClientById(TemperatureMeasurement.Complete.id);
  if (temperatureSensor && !this.stateChangeListeners.has(temperatureSensor)) {
    logger.debug(`Matter: Adding state change listener for TemperatureMeasurement cluster ${temperatureSensor.name}`);
    this.stateChangeListeners.add(temperatureSensor);
    const temperatureMeasurementExternalId = `matter:${nodeId}:${devicePath}:${TemperatureMeasurement.Complete.id}`;
    temperatureSensor.addMeasuredValueAttributeListener((value) => {
      logger.debug(`Matter: Temperature attribute changed to ${value}`);
      if (value !== null && value !== undefined) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: temperatureMeasurementExternalId,
          state: value / 100,
        });
      }
    });
  }

  const windowCover = device.getClusterClientById(WindowCovering.Complete.id);

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

  const levelControl = device.getClusterClientById(LevelControl.Complete.id);
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

  const colorControl = device.getClusterClientById(ColorControl.Complete.id);
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

  const relativeHumidityMeasurement = device.getClusterClientById(RelativeHumidityMeasurement.Complete.id);
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

  const pm25ConcentrationMeasurement = device.getClusterClientById(Pm25ConcentrationMeasurement.Complete.id);
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

  const pm10ConcentrationMeasurement = device.getClusterClientById(Pm10ConcentrationMeasurement.Complete.id);
  if (pm10ConcentrationMeasurement && !this.stateChangeListeners.has(pm10ConcentrationMeasurement)) {
    logger.debug(
      `Matter: Adding state change listener for Pm10ConcentrationMeasurement cluster ${pm10ConcentrationMeasurement.name}`,
    );
    this.stateChangeListeners.add(pm10ConcentrationMeasurement);
    // Subscribe to Pm10ConcentrationMeasurement attribute changes
    pm10ConcentrationMeasurement.addMeasuredValueAttributeListener((value) => {
      logger.debug(`Matter: Pm10ConcentrationMeasurement attribute changed to ${value}`);
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `matter:${nodeId}:${devicePath}:${Pm10ConcentrationMeasurement.Complete.id}`,
        state: value,
      });
    });
  }

  const totalVolatileOrganicCompoundsConcentrationMeasurement = device.getClusterClientById(
    TotalVolatileOrganicCompoundsConcentrationMeasurement.Complete.id,
  );
  if (
    totalVolatileOrganicCompoundsConcentrationMeasurement &&
    !this.stateChangeListeners.has(totalVolatileOrganicCompoundsConcentrationMeasurement)
  ) {
    logger.debug(
      `Matter: Adding state change listener for totalVolatileOrganicCompoundsConcentrationMeasurement cluster ${totalVolatileOrganicCompoundsConcentrationMeasurement.name}`,
    );
    this.stateChangeListeners.add(totalVolatileOrganicCompoundsConcentrationMeasurement);
    // Subscribe to TotalVolatileOrganicCompoundsConcentrationMeasurement attribute changes
    totalVolatileOrganicCompoundsConcentrationMeasurement.addLevelValueAttributeListener((value) => {
      logger.debug(`Matter: TotalVolatileOrganicCompoundsConcentrationMeasurement attribute changed to ${value}`);
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `matter:${nodeId}:${devicePath}:${TotalVolatileOrganicCompoundsConcentrationMeasurement.Complete.id}`,
        state: value,
      });
    });
  }

  const nitrogenDioxideConcentrationMeasurement = device.getClusterClientById(
    NitrogenDioxideConcentrationMeasurement.Complete.id,
  );
  if (
    nitrogenDioxideConcentrationMeasurement &&
    !this.stateChangeListeners.has(nitrogenDioxideConcentrationMeasurement)
  ) {
    logger.debug(
      `Matter: Adding state change listener for NitrogenDioxideConcentrationMeasurement cluster ${nitrogenDioxideConcentrationMeasurement.name}`,
    );
    this.stateChangeListeners.add(nitrogenDioxideConcentrationMeasurement);
    nitrogenDioxideConcentrationMeasurement.addLevelValueAttributeListener((value) => {
      logger.debug(`Matter: NitrogenDioxideConcentrationMeasurement attribute changed to ${value}`);
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `matter:${nodeId}:${devicePath}:${NitrogenDioxideConcentrationMeasurement.Complete.id}`,
        state: value,
      });
    });
  }

  const formaldehydeConcentrationMeasurement = device.getClusterClientById(
    FormaldehydeConcentrationMeasurement.Complete.id,
  );
  if (formaldehydeConcentrationMeasurement && !this.stateChangeListeners.has(formaldehydeConcentrationMeasurement)) {
    logger.debug(
      `Matter: Adding state change listener for FormaldehydeConcentrationMeasurement cluster ${formaldehydeConcentrationMeasurement.name}`,
    );
    this.stateChangeListeners.add(formaldehydeConcentrationMeasurement);
    // Subscribe to FormaldehydeConcentrationMeasurement attribute changes
    formaldehydeConcentrationMeasurement.addMeasuredValueAttributeListener((value) => {
      logger.debug(`Matter: FormaldehydeConcentrationMeasurement attribute changed to ${value}`);
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `matter:${nodeId}:${devicePath}:${FormaldehydeConcentrationMeasurement.Complete.id}`,
        state: value,
      });
    });
  }

  const thermostat = device.getClusterClientById(Thermostat.Complete.id);
  if (thermostat && !this.stateChangeListeners.has(thermostat)) {
    logger.debug(`Matter: Adding state change listener for Thermostat cluster ${thermostat.name}`);
    this.stateChangeListeners.add(thermostat);
    const localTemperatureExternalId = `matter:${nodeId}:${devicePath}:${Thermostat.Complete.id}:local-temperature`;
    thermostat.addLocalTemperatureAttributeListener((value) => {
      logger.debug(`Matter: Thermostat localTemperature attribute changed to ${value}`);
      if (value !== null && value !== undefined) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: localTemperatureExternalId,
          state: value / 100,
        });
      }
    });
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

  const electricalPowerMeasurement = device.getClusterClientById(ElectricalPowerMeasurement.Complete.id);
  if (electricalPowerMeasurement && !this.stateChangeListeners.has(electricalPowerMeasurement)) {
    logger.debug(
      `Matter: Adding state change listener for ElectricalPowerMeasurement cluster ${electricalPowerMeasurement.name}`,
    );
    this.stateChangeListeners.add(electricalPowerMeasurement);
    // Subscribe to ActivePower attribute changes
    electricalPowerMeasurement.addActivePowerAttributeListener((value) => {
      logger.debug(`Matter: ElectricalPowerMeasurement ActivePower attribute changed to ${value}`);
      // Value is in milliwatts, convert to watts
      const powerInWatts = value !== null ? value / 1000 : null;
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `matter:${nodeId}:${devicePath}:${ElectricalPowerMeasurement.Complete.id}:power`,
        state: powerInWatts,
      });
    });
    // Subscribe to Voltage attribute changes if available
    if (electricalPowerMeasurement.addVoltageAttributeListener) {
      electricalPowerMeasurement.addVoltageAttributeListener((value) => {
        logger.debug(`Matter: ElectricalPowerMeasurement Voltage attribute changed to ${value}`);
        // Value is in millivolts, convert to volts
        const voltageInVolts = value !== null ? value / 1000 : null;
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${ElectricalPowerMeasurement.Complete.id}:voltage`,
          state: voltageInVolts,
        });
      });
    }
    // Subscribe to ActiveCurrent attribute changes if available
    if (electricalPowerMeasurement.addActiveCurrentAttributeListener) {
      electricalPowerMeasurement.addActiveCurrentAttributeListener((value) => {
        logger.debug(`Matter: ElectricalPowerMeasurement ActiveCurrent attribute changed to ${value}`);
        // Value is in milliamps, convert to amps
        const currentInAmps = value !== null ? value / 1000 : null;
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${ElectricalPowerMeasurement.Complete.id}:current`,
          state: currentInAmps,
        });
      });
    }
  }

  const electricalEnergyMeasurement = device.getClusterClientById(ElectricalEnergyMeasurement.Complete.id);
  if (electricalEnergyMeasurement && !this.stateChangeListeners.has(electricalEnergyMeasurement)) {
    logger.debug(
      `Matter: Adding state change listener for ElectricalEnergyMeasurement cluster ${electricalEnergyMeasurement.name}`,
    );
    this.stateChangeListeners.add(electricalEnergyMeasurement);
    // Subscribe to CumulativeEnergyImported attribute changes if CumulativeEnergy feature is supported
    if (electricalEnergyMeasurement.addCumulativeEnergyImportedAttributeListener) {
      electricalEnergyMeasurement.addCumulativeEnergyImportedAttributeListener((value) => {
        logger.debug(`Matter: ElectricalEnergyMeasurement CumulativeEnergyImported attribute changed to`, value);
        // Value is an object with energy field in milliwatt-hours, convert to kilowatt-hours
        const energyInKwh = value && value.energy !== null ? value.energy / 1000000 : null;
        const externalId = `matter:${nodeId}:${devicePath}:${ElectricalEnergyMeasurement.Complete.id}:energy`;
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: externalId,
          state: energyInKwh,
        });
      });
    }
  }

  const hepaFilterMonitoring = device.getClusterClientById(HepaFilterMonitoring.Complete.id);
  if (hepaFilterMonitoring && !this.stateChangeListeners.has(hepaFilterMonitoring)) {
    logger.debug(`Matter: Adding state change listener for HepaFilterMonitoring cluster ${hepaFilterMonitoring.name}`);
    this.stateChangeListeners.add(hepaFilterMonitoring);
    // Subscribe to HepaFilterMonitoring attribute changes
    hepaFilterMonitoring.addConditionAttributeListener((value) => {
      logger.debug(`Matter: HepaFilterMonitoring Condition attribute changed to ${value}`);
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `matter:${nodeId}:${devicePath}:${HepaFilterMonitoring.Complete.id}`,
        state: value,
      });
    });
  }

  const fanControl = device.getClusterClientById(FanControl.Complete.id);
  if (fanControl && !this.stateChangeListeners.has(fanControl)) {
    logger.debug(`Matter: Adding state change listener for FanControl cluster ${fanControl.name}`);
    this.stateChangeListeners.add(fanControl);
    const fanBaseExternalId = `matter:${nodeId}:${devicePath}:${FanControl.Complete.id}`;

    fanControl.addFanModeAttributeListener((value) => {
      logger.debug(`Matter: FanControl FanMode attribute changed to ${value}`);
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `${fanBaseExternalId}:mode`,
        state: matterFanModeToGladys(value),
      });
    });

    fanControl.addPercentSettingAttributeListener((value) => {
      logger.debug(`Matter: FanControl PercentSetting attribute changed to ${value}`);
      if (value !== null) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `${fanBaseExternalId}:percent`,
          state: value,
        });
      }
    });

    fanControl.addPercentCurrentAttributeListener((value) => {
      logger.debug(`Matter: FanControl PercentCurrent attribute changed to ${value}`);
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `${fanBaseExternalId}:percent-current`,
        state: value,
      });
    });

    if (fanControl.supportedFeatures.multiSpeed) {
      fanControl.addSpeedSettingAttributeListener((value) => {
        logger.debug(`Matter: FanControl SpeedSetting attribute changed to ${value}`);
        if (value !== null) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: `${fanBaseExternalId}:speed`,
            state: value,
          });
        }
      });

      fanControl.addSpeedCurrentAttributeListener((value) => {
        logger.debug(`Matter: FanControl SpeedCurrent attribute changed to ${value}`);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `${fanBaseExternalId}:speed-current`,
          state: value,
        });
      });
    }

    if (fanControl.supportedFeatures.rocking) {
      fanControl.addRockSettingAttributeListener((value) => {
        logger.debug(`Matter: FanControl RockSetting attribute changed to ${JSON.stringify(value)}`);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `${fanBaseExternalId}:rock`,
          state: matterAttributeToNumber(value, FanControl.Complete.attributes.rockSetting.schema),
        });
      });
    }

    if (fanControl.supportedFeatures.wind) {
      fanControl.addWindSettingAttributeListener((value) => {
        logger.debug(`Matter: FanControl WindSetting attribute changed to ${JSON.stringify(value)}`);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `${fanBaseExternalId}:wind`,
          state: matterAttributeToNumber(value, FanControl.Complete.attributes.windSetting.schema),
        });
      });
    }

    if (fanControl.supportedFeatures.airflowDirection) {
      fanControl.addAirflowDirectionAttributeListener((value) => {
        logger.debug(`Matter: FanControl AirflowDirection attribute changed to ${value}`);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `${fanBaseExternalId}:airflow-direction`,
          state: value,
        });
      });
    }
  }

  const rvcOperationalState = device.getClusterClientById(RvcOperationalState.Complete.id);
  if (rvcOperationalState && !this.stateChangeListeners.has(rvcOperationalState)) {
    logger.debug(`Matter: Adding state change listener for RvcOperationalState cluster ${rvcOperationalState.name}`);
    this.stateChangeListeners.add(rvcOperationalState);
    // Subscribe to RvcOperationalState attribute changes
    rvcOperationalState.addOperationalStateAttributeListener((value) => {
      logger.debug(`Matter: RvcOperationalState attribute changed to ${value}`);
      // Convert Matter state to Gladys standard state
      const gladysState = convertMatterOperationalStateToGladys(value);
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `matter:${nodeId}:${devicePath}:${RvcOperationalState.Complete.id}:state`,
        state: gladysState,
      });
    });
  }

  const rvcRunMode = device.getClusterClientById(RvcRunMode.Complete.id);
  if (rvcRunMode && !this.stateChangeListeners.has(rvcRunMode)) {
    logger.debug(`Matter: Adding state change listener for RvcRunMode cluster ${rvcRunMode.name}`);
    this.stateChangeListeners.add(rvcRunMode);

    // Read and store supportedModes for this cluster
    const externalId = `matter:${nodeId}:${devicePath}:${RvcRunMode.Complete.id}`;
    try {
      if (rvcRunMode.attributes && rvcRunMode.attributes.supportedModes) {
        const supportedModes = await rvcRunMode.attributes.supportedModes.get();
        logger.info(`Matter: RvcRunMode supportedModes: ${JSON.stringify(supportedModes)}`);
        this.supportedModesMap.set(externalId, { supportedModes, clusterType: 'RvcRunMode' });
      }
    } catch (err) {
      logger.warn(`Matter: Failed to read RvcRunMode supportedModes: ${err.message}`);
    }

    // Subscribe to RvcRunMode attribute changes
    rvcRunMode.addCurrentModeAttributeListener((value) => {
      logger.debug(`Matter: RvcRunMode currentMode attribute changed to ${value}`);
      // Convert Matter mode to Gladys standard mode using stored supportedModes or fallback
      const gladysMode = convertMatterRunModeToGladys(value, this.supportedModesMap.get(externalId));
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: externalId,
        state: gladysMode,
      });
    });
  }

  const rvcCleanMode = device.getClusterClientById(RvcCleanMode.Complete.id);
  if (rvcCleanMode && !this.stateChangeListeners.has(rvcCleanMode)) {
    logger.debug(`Matter: Adding state change listener for RvcCleanMode cluster ${rvcCleanMode.name}`);
    this.stateChangeListeners.add(rvcCleanMode);

    // Read and store supportedModes for this cluster
    const cleanModeExternalId = `matter:${nodeId}:${devicePath}:${RvcCleanMode.Complete.id}`;
    try {
      if (rvcCleanMode.attributes && rvcCleanMode.attributes.supportedModes) {
        const supportedModes = await rvcCleanMode.attributes.supportedModes.get();
        logger.info(`Matter: RvcCleanMode supportedModes: ${JSON.stringify(supportedModes)}`);
        this.supportedModesMap.set(cleanModeExternalId, { supportedModes, clusterType: 'RvcCleanMode' });
      }
    } catch (err) {
      logger.warn(`Matter: Failed to read RvcCleanMode supportedModes: ${err.message}`);
    }

    // Subscribe to RvcCleanMode attribute changes
    rvcCleanMode.addCurrentModeAttributeListener((value) => {
      logger.debug(`Matter: RvcCleanMode currentMode attribute changed to ${value}`);
      // Convert Matter clean mode to Gladys standard clean mode using stored supportedModes or fallback
      const gladysMode = convertMatterCleanModeToGladys(value, this.supportedModesMap.get(cleanModeExternalId));
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: cleanModeExternalId,
        state: gladysMode,
      });
    });
  }

  const powerSource = device.getClusterClientById(PowerSource.Complete.id);
  if (powerSource && !this.stateChangeListeners.has(powerSource)) {
    logger.debug(`Matter: Adding state change listener for PowerSource cluster ${powerSource.name}`);
    this.stateChangeListeners.add(powerSource);
    // Subscribe to PowerSource battery percentage attribute changes
    if (powerSource.addBatPercentRemainingAttributeListener) {
      powerSource.addBatPercentRemainingAttributeListener((value) => {
        logger.debug(`Matter: PowerSource batPercentRemaining attribute changed to ${value}`);
        // Value is in half-percent units (0-200), convert to percent (0-100)
        const batteryPercent = value !== null ? Math.round(value / 2) : null;
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `matter:${nodeId}:${devicePath}:${PowerSource.Complete.id}:battery`,
          state: batteryPercent,
        });
      });
    }
  }
  await this.readInitialDeviceStates(nodeId, devicePath, device);
}

module.exports = {
  listenToStateChange,
};
