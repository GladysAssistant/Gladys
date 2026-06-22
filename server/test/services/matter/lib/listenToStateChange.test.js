const {
  OnOff,
  BooleanState,
  Switch,
  OccupancySensing,
  IlluminanceMeasurement,
  TemperatureMeasurement,
  WindowCovering,
  ColorControl,
  LevelControl,
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

const sinon = require('sinon');
const { expect } = require('chai');

const { fake, assert } = sinon;

const { EVENTS, STATE, BUTTON_STATUS, FAN_MODE } = require('../../../../utils/constants');

const MatterHandler = require('../../../../services/matter/lib');

describe('Matter.listenToStateChange', () => {
  let matterHandler;
  let gladys;

  beforeEach(() => {
    gladys = {
      event: {
        emit: fake.returns(null),
      },
      job: {
        wrapper: fake.returns(null),
      },
    };
    const MatterMain = {};
    const ProjectChipMatter = {};

    matterHandler = new MatterHandler(gladys, MatterMain, ProjectChipMatter, 'service-1');
  });

  it('should listen to state change (ON)', async () => {
    const clusterClient = {
      id: OnOff.Complete.id,
      addOnOffAttributeListener: (callback) => {
        callback(true);
      },
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:6',
      state: STATE.ON,
    });
  });
  it('should listen to state change (OFF)', async () => {
    const clusterClient = {
      id: OnOff.Complete.id,
      addOnOffAttributeListener: (callback) => {
        callback(false);
      },
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:6',
      state: STATE.OFF,
    });
  });
  it('should listen to state change in nested child endpoint (OFF)', async () => {
    const clusterClient = {
      id: OnOff.Complete.id,
      addOnOffAttributeListener: (callback) => {
        callback(false);
      },
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1:child_endpoint:2', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:child_endpoint:2:6',
      state: STATE.OFF,
    });
  });
  it('should listen to state change (BooleanState = true)', async () => {
    const clusterClient = {
      id: BooleanState.Complete.id,
      addStateValueAttributeListener: (callback) => {
        callback(true);
      },
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:69',
      state: STATE.ON,
    });
  });
  it('should listen to switch events', async () => {
    const clusterClient = {
      id: Switch.Complete.id,
      addInitialPressEventListener: (callback) => {
        callback();
      },
      addShortReleaseEventListener: (callback) => {
        callback();
      },
      addLongPressEventListener: (callback) => {
        callback();
      },
      addLongReleaseEventListener: (callback) => {
        callback();
      },
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:59:click',
      state: BUTTON_STATUS.INITIAL_PRESS,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:59:click',
      state: BUTTON_STATUS.SHORT_RELEASE,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:59:click',
      state: BUTTON_STATUS.LONG_PRESS,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:59:click',
      state: BUTTON_STATUS.LONG_RELEASE,
    });
  });
  it('should listen to state change (Occupancy = true)', async () => {
    const clusterClient = {
      id: OccupancySensing.Complete.id,
      addOccupancyAttributeListener: (callback) => {
        callback({ occupied: true });
      },
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:1030',
      state: STATE.ON,
    });
  });
  it('should listen to state change (Occupancy = false)', async () => {
    const clusterClient = {
      id: OccupancySensing.Complete.id,
      addOccupancyAttributeListener: (callback) => {
        callback({ occupied: false });
      },
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:1030',
      state: STATE.OFF,
    });
  });
  it('should listen to state change (IlluminanceMeasurement)', async () => {
    // Matter: Illuminance attribute changed to 21327 (Converted to 136 lux)
    const clusterClient = {
      id: IlluminanceMeasurement.Complete.id,
      addMeasuredValueAttributeListener: (callback) => {
        callback(21327);
      },
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:1024',
      state: 136,
    });
  });
  it('should listen to state change (TemperatureMeasurement)', async () => {
    const clusterClient = {
      id: TemperatureMeasurement.Complete.id,
      getMeasuredValueAttribute: fake.resolves(2150),
      addMeasuredValueAttributeListener: (callback) => {
        callback(2150);
      },
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledTwice(gladys.event.emit);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:1026',
      state: 21.5,
    });
  });
  it('should ignore failed initial TemperatureMeasurement read', async () => {
    const clusterClient = {
      id: TemperatureMeasurement.Complete.id,
      getMeasuredValueAttribute: fake.rejects(new Error('Read failed')),
      addMeasuredValueAttributeListener: fake.returns(null),
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.notCalled(gladys.event.emit);
  });
  it('should ignore null TemperatureMeasurement listener value', async () => {
    const clusterClient = {
      id: TemperatureMeasurement.Complete.id,
      getMeasuredValueAttribute: fake.resolves(null),
      addMeasuredValueAttributeListener: (callback) => {
        callback(null);
      },
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.notCalled(gladys.event.emit);
  });
  it('should listen to state change (RelativeHumidityMeasurement)', async () => {
    const clusterClient = {
      id: RelativeHumidityMeasurement.Complete.id,
      addMeasuredValueAttributeListener: (callback) => {
        callback(5000);
      },
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:1029',
      state: 50,
    });
  });
  it('should listen to state change (Pm25ConcentrationMeasurement)', async () => {
    const clusterClient = {
      id: Pm25ConcentrationMeasurement.Complete.id,
      addMeasuredValueAttributeListener: (callback) => {
        callback(100);
      },
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:1066',
      state: 100,
    });
  });
  it('should listen to state change (Pm10ConcentrationMeasurement)', async () => {
    const clusterClient = {
      id: Pm10ConcentrationMeasurement.Complete.id,
      addMeasuredValueAttributeListener: (callback) => {
        callback(100);
      },
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:1069',
      state: 100,
    });
  });
  it('should listen to state change (TotalVolatileOrganicCompoundsConcentrationMeasurement)', async () => {
    const clusterClient = {
      id: TotalVolatileOrganicCompoundsConcentrationMeasurement.Complete.id,
      addLevelValueAttributeListener: (callback) => {
        callback(3);
      },
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:1070',
      state: 3,
    });
  });
  it('should listen to state change (NitrogenDioxideConcentrationMeasurement)', async () => {
    const clusterClient = {
      id: NitrogenDioxideConcentrationMeasurement.Complete.id,
      addLevelValueAttributeListener: (callback) => {
        callback(2);
      },
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:1043',
      state: 2,
    });
  });
  it('should listen to state change (FormaldehydeConcentrationMeasurement)', async () => {
    const clusterClient = {
      id: FormaldehydeConcentrationMeasurement.Complete.id,
      addMeasuredValueAttributeListener: (callback) => {
        callback(100);
      },
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:1067',
      state: 100,
    });
  });
  it('should listen to state change (Thermostat heating)', async () => {
    const clusterClient = {
      id: Thermostat.Complete.id,
      supportedFeatures: {
        heating: true,
      },
      getLocalTemperatureAttribute: fake.resolves(null),
      addLocalTemperatureAttributeListener: fake.returns(null),
      addOccupiedHeatingSetpointAttributeListener: (callback) => {
        callback(2000);
      },
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:513:heating',
      state: 20,
    });
  });
  it('should listen to state change (Thermostat local temperature)', async () => {
    const clusterClient = {
      id: Thermostat.Complete.id,
      supportedFeatures: {},
      getLocalTemperatureAttribute: fake.resolves(5220),
      addLocalTemperatureAttributeListener: (callback) => {
        callback(5210);
      },
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledTwice(gladys.event.emit);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:513:local-temperature',
      state: 52.2,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:513:local-temperature',
      state: 52.1,
    });
  });
  it('should ignore failed initial Thermostat localTemperature read', async () => {
    const clusterClient = {
      id: Thermostat.Complete.id,
      supportedFeatures: {},
      getLocalTemperatureAttribute: fake.rejects(new Error('Read failed')),
      addLocalTemperatureAttributeListener: fake.returns(null),
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.notCalled(gladys.event.emit);
  });
  it('should listen to state change (Thermostat cooling)', async () => {
    const clusterClient = {
      id: Thermostat.Complete.id,
      supportedFeatures: {
        cooling: true,
      },
      getLocalTemperatureAttribute: fake.resolves(null),
      addLocalTemperatureAttributeListener: fake.returns(null),
      addOccupiedCoolingSetpointAttributeListener: (callback) => {
        callback(2000);
      },
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:513:cooling',
      state: 20,
    });
  });
  it('should listen to state change (WindowCovering)', async () => {
    const clusterClient = {
      id: WindowCovering.Complete.id,
      addCurrentPositionLiftPercent100thsAttributeListener: (callback) => {
        callback(8400);
      },
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:258:position',
      state: 84,
    });
  });
  it('should listen to state change (LevelControl)', async () => {
    const clusterClient = {
      id: LevelControl.Complete.id,
      addCurrentLevelAttributeListener: (callback) => {
        callback(99);
      },
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:8',
      state: 99,
    });
  });
  it('should listen to state change (ColorControl)', async () => {
    let clusterClient;
    const promise = new Promise((resolve) => {
      let callCount = 0;
      const checkThatEveryThingWasCalled = () => {
        callCount += 1;
        if (callCount === 4) {
          resolve();
        }
      };
      clusterClient = {
        id: ColorControl.Complete.id,
        supportedFeatures: {
          hueSaturation: true,
        },
        addCurrentHueAttributeListener: (callback) => {
          callback(100);
          checkThatEveryThingWasCalled();
        },
        addCurrentSaturationAttributeListener: (callback) => {
          callback(40);
          checkThatEveryThingWasCalled();
        },
        getCurrentHueAttribute: () => {
          checkThatEveryThingWasCalled();
          return 100;
        },
        getCurrentSaturationAttribute: () => {
          checkThatEveryThingWasCalled();
          return 40;
        },
      };
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    // We need to make sure that we called all 4 functions before checking the events
    await promise;
    assert.calledThrice(gladys.event.emit);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:768:color',
      state: 14090213,
    });
  });
  it('should listen to state change (ElectricalPowerMeasurement - ActivePower)', async () => {
    const clusterClient = {
      id: ElectricalPowerMeasurement.Complete.id,
      addActivePowerAttributeListener: (callback) => {
        callback(1500000); // 1500000 mW = 1500 W
      },
      addVoltageAttributeListener: () => {},
      addActiveCurrentAttributeListener: () => {},
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:144:power',
      state: 1500,
    });
  });
  it('should listen to state change (ElectricalPowerMeasurement - Voltage)', async () => {
    const clusterClient = {
      id: ElectricalPowerMeasurement.Complete.id,
      supportedFeatures: {
        voltage: true,
      },
      addActivePowerAttributeListener: () => {},
      addVoltageAttributeListener: (callback) => {
        callback(230000); // 230000 mV = 230 V
      },
      addActiveCurrentAttributeListener: () => {},
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:144:voltage',
      state: 230,
    });
  });
  it('should listen to state change (ElectricalPowerMeasurement - ActiveCurrent)', async () => {
    const clusterClient = {
      id: ElectricalPowerMeasurement.Complete.id,
      supportedFeatures: {
        current: true,
      },
      addActivePowerAttributeListener: () => {},
      addVoltageAttributeListener: () => {},
      addActiveCurrentAttributeListener: (callback) => {
        callback(6500); // 6500 mA = 6.5 A
      },
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:144:current',
      state: 6.5,
    });
  });
  it('should listen to state change (ElectricalEnergyMeasurement - CumulativeEnergy)', async () => {
    const clusterClient = {
      id: ElectricalEnergyMeasurement.Complete.id,
      supportedFeatures: {
        cumulativeEnergy: true,
      },
      addCumulativeEnergyImportedAttributeListener: (callback) => {
        callback({ energy: 1500000000 }); // 1500000000 mWh = 1500 kWh
      },
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:145:energy',
      state: 1500,
    });
  });
  it('should listen to state change (HepaFilterMonitoring)', async () => {
    const clusterClient = {
      id: HepaFilterMonitoring.Complete.id,
      addConditionAttributeListener: (callback) => {
        callback(75); // 75% filter life remaining
      },
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:113',
      state: 75,
    });
  });
  it('should listen to state change (FanControl)', async () => {
    const clusterClient = {
      id: FanControl.Complete.id,
      supportedFeatures: {
        multiSpeed: true,
        rocking: true,
        wind: true,
        airflowDirection: true,
      },
      addFanModeAttributeListener: (callback) => {
        callback(5);
      },
      addPercentSettingAttributeListener: (callback) => {
        callback(50);
      },
      addPercentCurrentAttributeListener: (callback) => {
        callback(48);
      },
      addSpeedSettingAttributeListener: (callback) => {
        callback(5);
      },
      addSpeedCurrentAttributeListener: (callback) => {
        callback(5);
      },
      addRockSettingAttributeListener: (callback) => {
        callback({ rockLeftRight: true });
      },
      addWindSettingAttributeListener: (callback) => {
        callback({ sleepWind: true });
      },
      addAirflowDirectionAttributeListener: (callback) => {
        callback(0);
      },
    };
    const device = {
      number: 1,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    const fanBaseExternalId = `matter:1234:1:${FanControl.Complete.id}`;
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `${fanBaseExternalId}:mode`,
      state: FAN_MODE.AUTO,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `${fanBaseExternalId}:percent`,
      state: 50,
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
      device_feature_external_id: `${fanBaseExternalId}:airflow-direction`,
      state: 0,
    });
  });

  it('should listen to state change (RvcOperationalState)', async () => {
    const clusterClient = {
      id: RvcOperationalState.Complete.id,
      addOperationalStateAttributeListener: (callback) => {
        callback(66); // Matter DOCKED state (66) should be converted to Gladys DOCKED state (6)
      },
    };
    const device = {
      number: 2,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '1:child_endpoint:2', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:child_endpoint:2:97:state',
      state: 6, // Gladys standard DOCKED state
    });
  });
  it('should listen to state change (RvcRunMode)', async () => {
    const clusterClient = {
      id: RvcRunMode.Complete.id,
      addCurrentModeAttributeListener: (callback) => {
        callback(1); // Cleaning mode
      },
    };
    const device = {
      number: 2,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '2', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:2:84',
      state: 1,
    });
  });
  it('should listen to state change (RvcRunMode) with supportedModes', async () => {
    const supportedModes = [
      { mode: 1, label: 'Idle', modeTags: [{ value: 16384 }] },
      { mode: 2, label: 'Cleaning', modeTags: [{ value: 16385 }] },
    ];
    const clusterClient = {
      id: RvcRunMode.Complete.id,
      attributes: {
        supportedModes: {
          get: fake.resolves(supportedModes),
        },
      },
      addCurrentModeAttributeListener: (callback) => {
        callback(2); // Matter mode 2 with ModeTag 16385 (Cleaning) -> Gladys CLEANING (1)
      },
    };
    const device = {
      number: 2,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '2', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:2:84',
      state: 1, // Gladys CLEANING mode
    });
    // Verify supportedModes was stored
    const storedData = matterHandler.supportedModesMap.get('matter:1234:2:84');
    expect(storedData).to.deep.equal({ supportedModes, clusterType: 'RvcRunMode' });
  });
  it('should handle RvcRunMode supportedModes read failure gracefully', async () => {
    const clusterClient = {
      id: RvcRunMode.Complete.id,
      attributes: {
        supportedModes: {
          get: fake.rejects(new Error('Read failed')),
        },
      },
      addCurrentModeAttributeListener: (callback) => {
        callback(1);
      },
    };
    const device = {
      number: 2,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    // Should not throw, just log warning
    await matterHandler.listenToStateChange(1234n, '2', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:2:84',
      state: 1,
    });
  });
  it('should listen to state change (RvcCleanMode)', async () => {
    const clusterClient = {
      id: RvcCleanMode.Complete.id,
      addCurrentModeAttributeListener: (callback) => {
        callback(16384); // Matter DEEP_CLEAN (16384) should be converted to Gladys DEEP_CLEAN (4)
      },
    };
    const device = {
      number: 2,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '2', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:2:85',
      state: 4, // Gladys standard DEEP_CLEAN mode
    });
  });
  it('should listen to state change (RvcCleanMode) with supportedModes', async () => {
    const supportedModes = [{ mode: 1, label: 'Vacuum', modeTags: [{ value: 16385 }] }];
    const clusterClient = {
      id: RvcCleanMode.Complete.id,
      attributes: {
        supportedModes: {
          get: fake.resolves(supportedModes),
        },
      },
      addCurrentModeAttributeListener: (callback) => {
        callback(1); // Matter mode 1 with ModeTag 16385 (Vacuum) -> Gladys VACUUM (5)
      },
    };
    const device = {
      number: 2,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '2', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:2:85',
      state: 5, // Gladys VACUUM mode
    });
    // Verify supportedModes was stored
    const storedData = matterHandler.supportedModesMap.get('matter:1234:2:85');
    expect(storedData).to.deep.equal({ supportedModes, clusterType: 'RvcCleanMode' });
  });
  it('should handle RvcCleanMode supportedModes read failure gracefully', async () => {
    const clusterClient = {
      id: RvcCleanMode.Complete.id,
      attributes: {
        supportedModes: {
          get: fake.rejects(new Error('Read failed')),
        },
      },
      addCurrentModeAttributeListener: (callback) => {
        callback(0);
      },
    };
    const device = {
      number: 2,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    // Should not throw, just log warning
    await matterHandler.listenToStateChange(1234n, '2', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:2:85',
      state: 0,
    });
  });
  it('should listen to state change (PowerSource battery)', async () => {
    const clusterClient = {
      id: PowerSource.Complete.id,
      addBatPercentRemainingAttributeListener: (callback) => {
        callback(150); // 150 half-percent = 75%
      },
    };
    const device = {
      number: 2,
      getClusterClientById: (id) => (id === clusterClient.id ? clusterClient : null),
    };
    await matterHandler.listenToStateChange(1234n, '2', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:2:47:battery',
      state: 75,
    });
  });
});
