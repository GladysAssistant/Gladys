const { expect } = require('chai');
const { assert, fake } = require('sinon');

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

const MatterHandler = require('../../../../services/matter/lib');
const { EVENTS, STATE, FAN_MODE } = require('../../../../utils/constants');

describe('Matter.readInitialDeviceStates', () => {
  let matterHandler;
  let gladys;

  beforeEach(() => {
    gladys = {
      event: {
        emit: fake(),
      },
      job: {
        wrapper: fake.returns(null),
      },
    };
    matterHandler = new MatterHandler(gladys, {}, {}, 'service-id');
  });

  it('should ignore attribute read errors', async () => {
    const onOff = {
      getOnOffAttribute: fake.rejects(new Error('read failed')),
    };
    const device = {
      getClusterClientById: (id) => (id === OnOff.Complete.id ? onOff : null),
    };

    await matterHandler.readInitialDeviceStates(1234n, '1', device);

    assert.notCalled(gladys.event.emit);
  });

  it('should read initial states for all supported clusters', async () => {
    const nodeId = 1234n;
    const devicePath = '1';
    const runModeExternalId = `matter:${nodeId}:${devicePath}:${RvcRunMode.Complete.id}`;
    const cleanModeExternalId = `matter:${nodeId}:${devicePath}:${RvcCleanMode.Complete.id}`;
    const fanBaseExternalId = `matter:${nodeId}:${devicePath}:${FanControl.Complete.id}`;

    matterHandler.supportedModesMap.set(runModeExternalId, { supportedModes: [{ mode: 1, label: 'Cleaning' }] });
    matterHandler.supportedModesMap.set(cleanModeExternalId, { supportedModes: [{ mode: 2, label: 'Deep' }] });

    const clusterClients = {
      [OnOff.Complete.id]: {
        getOnOffAttribute: fake.resolves(true),
      },
      [BooleanState.Complete.id]: {
        getStateValueAttribute: fake.resolves(false),
      },
      [OccupancySensing.Complete.id]: {
        getOccupancyAttribute: fake.resolves({ occupied: false }),
      },
      [IlluminanceMeasurement.Complete.id]: {
        getMeasuredValueAttribute: fake.resolves(10001),
      },
      [TemperatureMeasurement.Complete.id]: {
        getMeasuredValueAttribute: fake.resolves(2100),
      },
      [WindowCovering.Complete.id]: {
        getCurrentPositionLiftPercent100thsAttribute: fake.resolves(5000),
      },
      [LevelControl.Complete.id]: {
        getCurrentLevelAttribute: fake.resolves(128),
      },
      [ColorControl.Complete.id]: {
        supportedFeatures: { hueSaturation: true },
        getCurrentHueAttribute: fake.resolves(127),
        getCurrentSaturationAttribute: fake.resolves(127),
      },
      [RelativeHumidityMeasurement.Complete.id]: {
        getMeasuredValueAttribute: fake.resolves(4500),
      },
      [Pm25ConcentrationMeasurement.Complete.id]: {
        getMeasuredValueAttribute: fake.resolves(12),
      },
      [Pm10ConcentrationMeasurement.Complete.id]: {
        getMeasuredValueAttribute: fake.resolves(20),
      },
      [TotalVolatileOrganicCompoundsConcentrationMeasurement.Complete.id]: {
        getLevelValueAttribute: fake.resolves(3),
      },
      [NitrogenDioxideConcentrationMeasurement.Complete.id]: {
        getLevelValueAttribute: fake.resolves(2),
      },
      [FormaldehydeConcentrationMeasurement.Complete.id]: {
        getMeasuredValueAttribute: fake.resolves(5),
      },
      [Thermostat.Complete.id]: {
        supportedFeatures: { heating: true, cooling: true },
        getOccupiedHeatingSetpointAttribute: fake.resolves(2000),
        getOccupiedCoolingSetpointAttribute: fake.resolves(2400),
      },
      [ElectricalPowerMeasurement.Complete.id]: {
        getActivePowerAttribute: fake.resolves(5000),
        getVoltageAttribute: fake.resolves(230000),
        getActiveCurrentAttribute: fake.resolves(1000),
      },
      [ElectricalEnergyMeasurement.Complete.id]: {
        getCumulativeEnergyImportedAttribute: fake.resolves({ energy: 3000000 }),
      },
      [HepaFilterMonitoring.Complete.id]: {
        getConditionAttribute: fake.resolves(67),
      },
      [FanControl.Complete.id]: {
        supportedFeatures: {
          multiSpeed: true,
          rocking: true,
          wind: true,
          airflowDirection: true,
        },
        getFanModeAttribute: fake.resolves(5),
        getPercentSettingAttribute: fake.resolves(50),
        getPercentCurrentAttribute: fake.resolves(48),
        getSpeedSettingAttribute: fake.resolves(5),
        getSpeedCurrentAttribute: fake.resolves(4),
        getRockSettingAttribute: fake.resolves({ rockLeftRight: true }),
        getWindSettingAttribute: fake.resolves({ sleepWind: true }),
        getAirflowDirectionAttribute: fake.resolves(0),
      },
      [RvcOperationalState.Complete.id]: {
        getOperationalStateAttribute: fake.resolves(66),
      },
      [RvcRunMode.Complete.id]: {
        getCurrentModeAttribute: fake.resolves(1),
      },
      [RvcCleanMode.Complete.id]: {
        getCurrentModeAttribute: fake.resolves(2),
      },
      [PowerSource.Complete.id]: {
        getBatPercentRemainingAttribute: fake.resolves(100),
      },
    };

    const device = {
      getClusterClientById: (id) => clusterClients[id] || null,
    };

    await matterHandler.readInitialDeviceStates(nodeId, devicePath, device);

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `matter:${nodeId}:${devicePath}:${OnOff.Complete.id}`,
      state: STATE.ON,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `matter:${nodeId}:${devicePath}:${BooleanState.Complete.id}`,
      state: STATE.OFF,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `matter:${nodeId}:${devicePath}:${OccupancySensing.Complete.id}`,
      state: STATE.OFF,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `matter:${nodeId}:${devicePath}:${TemperatureMeasurement.Complete.id}`,
      state: 21,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `matter:${nodeId}:${devicePath}:${WindowCovering.Complete.id}:position`,
      state: 50,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `matter:${nodeId}:${devicePath}:${LevelControl.Complete.id}`,
      state: 128,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `matter:${nodeId}:${devicePath}:${ElectricalPowerMeasurement.Complete.id}:power`,
      state: 5,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `matter:${nodeId}:${devicePath}:${ElectricalPowerMeasurement.Complete.id}:voltage`,
      state: 230,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `matter:${nodeId}:${devicePath}:${ElectricalPowerMeasurement.Complete.id}:current`,
      state: 1,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `matter:${nodeId}:${devicePath}:${ElectricalEnergyMeasurement.Complete.id}:energy`,
      state: 3,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `${fanBaseExternalId}:mode`,
      state: FAN_MODE.AUTO,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `${fanBaseExternalId}:speed-current`,
      state: 4,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `${fanBaseExternalId}:rock`,
      state: 1,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `${fanBaseExternalId}:wind`,
      state: 1,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `matter:${nodeId}:${devicePath}:${RvcOperationalState.Complete.id}:state`,
      state: 6,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `matter:${nodeId}:${devicePath}:${PowerSource.Complete.id}:battery`,
      state: 50,
    });
    expect(gladys.event.emit.callCount).to.be.greaterThan(20);
  });

  it('should skip null electrical measurements and undefined vacuum modes', async () => {
    const clusterClients = {
      [ElectricalPowerMeasurement.Complete.id]: {
        getActivePowerAttribute: fake.resolves(null),
        getVoltageAttribute: fake.resolves(undefined),
        getActiveCurrentAttribute: fake.resolves(undefined),
      },
      [ElectricalEnergyMeasurement.Complete.id]: {
        getCumulativeEnergyImportedAttribute: fake.resolves(undefined),
      },
      [RvcRunMode.Complete.id]: {
        getCurrentModeAttribute: fake.resolves(undefined),
      },
      [RvcCleanMode.Complete.id]: {
        getCurrentModeAttribute: fake.resolves(undefined),
      },
      [PowerSource.Complete.id]: {
        getBatPercentRemainingAttribute: fake.resolves(null),
      },
    };

    const device = {
      getClusterClientById: (id) => clusterClients[id] || null,
    };

    await matterHandler.readInitialDeviceStates(1234n, '1', device);

    assert.notCalled(gladys.event.emit);
  });

  it('should skip optional fan and color attributes when values are missing', async () => {
    const fanControl = {
      supportedFeatures: {
        multiSpeed: false,
        rocking: false,
        wind: false,
        airflowDirection: false,
      },
      getFanModeAttribute: fake.resolves(undefined),
      getPercentSettingAttribute: fake.resolves(null),
      getPercentCurrentAttribute: fake.resolves(undefined),
    };
    const colorControl = {
      supportedFeatures: { hueSaturation: true },
      getCurrentHueAttribute: fake.resolves(undefined),
      getCurrentSaturationAttribute: fake.resolves(127),
    };

    const device = {
      getClusterClientById: (id) => {
        if (id === FanControl.Complete.id) {
          return fanControl;
        }
        if (id === ColorControl.Complete.id) {
          return colorControl;
        }
        return null;
      },
    };

    await matterHandler.readInitialDeviceStates(1234n, '1', device);

    assert.notCalled(gladys.event.emit);
  });

  it('should skip color control when hue saturation is not supported', async () => {
    const colorControl = {
      supportedFeatures: {},
      getCurrentHueAttribute: fake.resolves(127),
      getCurrentSaturationAttribute: fake.resolves(127),
    };
    const device = {
      getClusterClientById: (id) => (id === ColorControl.Complete.id ? colorControl : null),
    };

    await matterHandler.readInitialDeviceStates(1234n, '1', device);

    assert.notCalled(gladys.event.emit);
  });

  it('should skip thermostat attributes when feature is not supported', async () => {
    const thermostat = {
      supportedFeatures: {},
      getOccupiedHeatingSetpointAttribute: fake.resolves(2000),
      getOccupiedCoolingSetpointAttribute: fake.resolves(2400),
    };
    const device = {
      getClusterClientById: (id) => (id === Thermostat.Complete.id ? thermostat : null),
    };

    await matterHandler.readInitialDeviceStates(1234n, '1', device);

    assert.notCalled(gladys.event.emit);
  });

  it('should skip fan rock and wind when attribute reads return undefined', async () => {
    const fanControl = {
      supportedFeatures: {
        rocking: true,
        wind: true,
      },
      getFanModeAttribute: fake.resolves(undefined),
      getPercentSettingAttribute: fake.resolves(null),
      getPercentCurrentAttribute: fake.resolves(undefined),
      getRockSettingAttribute: fake.resolves(undefined),
      getWindSettingAttribute: fake.resolves(undefined),
    };
    const device = {
      getClusterClientById: (id) => (id === FanControl.Complete.id ? fanControl : null),
    };

    await matterHandler.readInitialDeviceStates(1234n, '1', device);

    assert.notCalled(gladys.event.emit);
  });

  it('should skip vacuum operational state when attribute read returns undefined', async () => {
    const rvcOperationalState = {
      getOperationalStateAttribute: fake.resolves(undefined),
    };
    const device = {
      getClusterClientById: (id) => (id === RvcOperationalState.Complete.id ? rvcOperationalState : null),
    };

    await matterHandler.readInitialDeviceStates(1234n, '1', device);

    assert.notCalled(gladys.event.emit);
  });

  it('should handle null electrical and fan speed readings', async () => {
    const fanBaseExternalId = `matter:1234:1:${FanControl.Complete.id}`;
    const clusterClients = {
      [ElectricalPowerMeasurement.Complete.id]: {
        getActivePowerAttribute: fake.resolves(undefined),
        getVoltageAttribute: fake.resolves(null),
        getActiveCurrentAttribute: fake.resolves(null),
      },
      [ElectricalEnergyMeasurement.Complete.id]: {
        getCumulativeEnergyImportedAttribute: fake.resolves({ energy: null }),
      },
      [FanControl.Complete.id]: {
        supportedFeatures: { multiSpeed: true },
        getFanModeAttribute: fake.resolves(undefined),
        getPercentSettingAttribute: fake.resolves(null),
        getPercentCurrentAttribute: fake.resolves(undefined),
        getSpeedSettingAttribute: fake.resolves(null),
        getSpeedCurrentAttribute: fake.resolves(2),
      },
      [PowerSource.Complete.id]: {
        getBatPercentRemainingAttribute: fake.resolves(null),
      },
    };
    const device = {
      getClusterClientById: (id) => clusterClients[id] || null,
    };

    await matterHandler.readInitialDeviceStates(1234n, '1', device);

    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `${fanBaseExternalId}:speed-current`,
      state: 2,
    });
  });

  it('should skip undefined window cover, humidity and thermostat readings', async () => {
    const clusterClients = {
      [WindowCovering.Complete.id]: {
        getCurrentPositionLiftPercent100thsAttribute: fake.resolves(undefined),
      },
      [RelativeHumidityMeasurement.Complete.id]: {
        getMeasuredValueAttribute: fake.resolves(undefined),
      },
      [Thermostat.Complete.id]: {
        supportedFeatures: { heating: true, cooling: true },
        getOccupiedHeatingSetpointAttribute: fake.resolves(undefined),
        getOccupiedCoolingSetpointAttribute: fake.resolves(undefined),
      },
      [PowerSource.Complete.id]: {
        getBatPercentRemainingAttribute: fake.resolves(null),
      },
    };
    const device = {
      getClusterClientById: (id) => clusterClients[id] || null,
    };

    await matterHandler.readInitialDeviceStates(1234n, '1', device);

    assert.notCalled(gladys.event.emit);
  });

  it('should read occupied, illuminance and temperature when values are present', async () => {
    const clusterClients = {
      [OccupancySensing.Complete.id]: {
        getOccupancyAttribute: fake.resolves({ occupied: true }),
      },
      [IlluminanceMeasurement.Complete.id]: {
        getMeasuredValueAttribute: fake.resolves(10001),
      },
      [TemperatureMeasurement.Complete.id]: {
        getMeasuredValueAttribute: fake.resolves(2500),
      },
    };
    const device = {
      getClusterClientById: (id) => clusterClients[id] || null,
    };

    await matterHandler.readInitialDeviceStates(1234n, '1', device);

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `matter:1234:1:${OccupancySensing.Complete.id}`,
      state: STATE.ON,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `matter:1234:1:${TemperatureMeasurement.Complete.id}`,
      state: 25,
    });
  });

  it('should skip illuminance and temperature when reads return undefined', async () => {
    const clusterClients = {
      [IlluminanceMeasurement.Complete.id]: {
        getMeasuredValueAttribute: fake.resolves(undefined),
      },
      [TemperatureMeasurement.Complete.id]: {
        getMeasuredValueAttribute: fake.resolves(undefined),
      },
    };
    const device = {
      getClusterClientById: (id) => clusterClients[id] || null,
    };

    await matterHandler.readInitialDeviceStates(1234n, '1', device);

    assert.notCalled(gladys.event.emit);
  });

  it('should skip temperature when read returns null', async () => {
    const temperature = {
      getMeasuredValueAttribute: fake.resolves(null),
    };
    const device = {
      getClusterClientById: (id) => (id === TemperatureMeasurement.Complete.id ? temperature : null),
    };

    await matterHandler.readInitialDeviceStates(1234n, '1', device);

    assert.notCalled(gladys.event.emit);
  });

  it('should read onOff off state and boolean on state', async () => {
    const clusterClients = {
      [OnOff.Complete.id]: {
        getOnOffAttribute: fake.resolves(false),
      },
      [BooleanState.Complete.id]: {
        getStateValueAttribute: fake.resolves(true),
      },
      [PowerSource.Complete.id]: {
        getBatPercentRemainingAttribute: fake.resolves(0),
      },
    };
    const device = {
      getClusterClientById: (id) => clusterClients[id] || null,
    };

    await matterHandler.readInitialDeviceStates(1234n, '1', device);

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `matter:1234:1:${OnOff.Complete.id}`,
      state: STATE.OFF,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `matter:1234:1:${BooleanState.Complete.id}`,
      state: STATE.ON,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `matter:1234:1:${PowerSource.Complete.id}:battery`,
      state: 0,
    });
  });

  it('should read boolean off state and skip undefined onOff readings', async () => {
    const clusterClients = {
      [OnOff.Complete.id]: {
        getOnOffAttribute: fake.resolves(undefined),
      },
      [BooleanState.Complete.id]: {
        getStateValueAttribute: fake.resolves(false),
      },
      [OccupancySensing.Complete.id]: {
        getOccupancyAttribute: fake.resolves({ occupied: true }),
      },
      [PowerSource.Complete.id]: {
        getBatPercentRemainingAttribute: fake.resolves(undefined),
      },
    };
    const device = {
      getClusterClientById: (id) => clusterClients[id] || null,
    };

    await matterHandler.readInitialDeviceStates(1234n, '1', device);

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `matter:1234:1:${BooleanState.Complete.id}`,
      state: STATE.OFF,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `matter:1234:1:${OccupancySensing.Complete.id}`,
      state: STATE.ON,
    });
  });

  it('should skip boolean state when attribute read returns undefined', async () => {
    const booleanState = {
      getStateValueAttribute: fake.resolves(undefined),
    };
    const device = {
      getClusterClientById: (id) => (id === BooleanState.Complete.id ? booleanState : null),
    };

    await matterHandler.readInitialDeviceStates(1234n, '1', device);

    assert.notCalled(gladys.event.emit);
  });

  it('should treat empty occupancy payload as not occupied', async () => {
    const occupancy = {
      getOccupancyAttribute: fake.resolves({}),
    };
    const device = {
      getClusterClientById: (id) => (id === OccupancySensing.Complete.id ? occupancy : null),
    };

    await matterHandler.readInitialDeviceStates(1234n, '1', device);

    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `matter:1234:1:${OccupancySensing.Complete.id}`,
      state: STATE.OFF,
    });
  });

  it('should skip occupancy when attribute read returns null', async () => {
    const occupancy = {
      getOccupancyAttribute: fake.resolves(null),
    };
    const device = {
      getClusterClientById: (id) => (id === OccupancySensing.Complete.id ? occupancy : null),
    };

    await matterHandler.readInitialDeviceStates(1234n, '1', device);

    assert.notCalled(gladys.event.emit);
  });
});
