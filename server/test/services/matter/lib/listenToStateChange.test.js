const {
  OnOff,
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
  FormaldehydeConcentrationMeasurement,
  ElectricalPowerMeasurement,
  ElectricalEnergyMeasurement,
  // eslint-disable-next-line import/no-unresolved
} = require('@matter/main/clusters');

const sinon = require('sinon');

const { fake, assert } = sinon;

const { EVENTS, STATE } = require('../../../../utils/constants');

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
    const clusterClients = new Map();
    clusterClients.set(OnOff.Complete.id, {
      attributes: {
        onOff: {
          get: fake.resolves(true),
        },
      },
      addOnOffAttributeListener: (callback) => {
        callback(true);
      },
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:6',
      state: STATE.ON,
    });
  });
  it('should listen to state change (OFF)', async () => {
    const clusterClients = new Map();
    clusterClients.set(OnOff.Complete.id, {
      attributes: {
        onOff: {
          get: fake.resolves(false),
        },
      },
      addOnOffAttributeListener: (callback) => {
        callback(false);
      },
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:6',
      state: STATE.OFF,
    });
  });
  it('should listen to state change in nested child endpoint (OFF)', async () => {
    const clusterClients = new Map();
    clusterClients.set(OnOff.Complete.id, {
      attributes: {
        onOff: {
          get: fake.resolves(false),
        },
      },
      addOnOffAttributeListener: (callback) => {
        callback(false);
      },
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1:child_endpoint:2', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:child_endpoint:2:6',
      state: STATE.OFF,
    });
  });
  it('should listen to state change (Occupancy = true)', async () => {
    const clusterClients = new Map();
    clusterClients.set(OccupancySensing.Complete.id, {
      attributes: {
        occupancy: {
          get: fake.resolves({ occupied: true }),
        },
      },
      addOccupancyAttributeListener: (callback) => {
        callback({ occupied: true });
      },
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:1030',
      state: STATE.ON,
    });
  });
  it('should listen to state change (Occupancy = false)', async () => {
    const clusterClients = new Map();
    clusterClients.set(OccupancySensing.Complete.id, {
      attributes: {
        occupancy: {
          get: fake.resolves({ occupied: false }),
        },
      },
      addOccupancyAttributeListener: (callback) => {
        callback({ occupied: false });
      },
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:1030',
      state: STATE.OFF,
    });
  });
  it('should listen to state change (IlluminanceMeasurement)', async () => {
    const clusterClients = new Map();
    // Matter: Illuminance attribute changed to 21327 (Converted to 136 lux)
    clusterClients.set(IlluminanceMeasurement.Complete.id, {
      attributes: {
        measuredValue: {
          get: fake.resolves(21327),
        },
      },
      addMeasuredValueAttributeListener: (callback) => {
        callback(21327);
      },
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:1024',
      state: 136,
    });
  });
  it('should listen to state change (TemperatureMeasurement)', async () => {
    const clusterClients = new Map();
    clusterClients.set(TemperatureMeasurement.Complete.id, {
      attributes: {
        measuredValue: {
          get: fake.resolves(2150),
        },
      },
      addMeasuredValueAttributeListener: (callback) => {
        callback(2150);
      },
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:1026',
      state: 21.5,
    });
  });
  it('should listen to state change (RelativeHumidityMeasurement)', async () => {
    const clusterClients = new Map();
    clusterClients.set(RelativeHumidityMeasurement.Complete.id, {
      attributes: {
        measuredValue: {
          get: fake.resolves(5000),
        },
      },
      addMeasuredValueAttributeListener: (callback) => {
        callback(5000);
      },
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:1029',
      state: 50,
    });
  });
  it('should listen to state change (Pm25ConcentrationMeasurement)', async () => {
    const clusterClients = new Map();
    clusterClients.set(Pm25ConcentrationMeasurement.Complete.id, {
      attributes: {
        measuredValue: {
          get: fake.resolves(100),
        },
      },
      addMeasuredValueAttributeListener: (callback) => {
        callback(100);
      },
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:1066',
      state: 100,
    });
  });
  it('should listen to state change (Pm10ConcentrationMeasurement)', async () => {
    const clusterClients = new Map();
    clusterClients.set(Pm10ConcentrationMeasurement.Complete.id, {
      attributes: {
        measuredValue: {
          get: fake.resolves(100),
        },
      },
      addMeasuredValueAttributeListener: (callback) => {
        callback(100);
      },
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:1069',
      state: 100,
    });
  });
  it('should listen to state change (TotalVolatileOrganicCompoundsConcentrationMeasurement)', async () => {
    const clusterClients = new Map();
    clusterClients.set(TotalVolatileOrganicCompoundsConcentrationMeasurement.Complete.id, {
      attributes: {
        levelValue: {
          get: fake.resolves(3),
        },
      },
      addLevelValueAttributeListener: (callback) => {
        callback(3);
      },
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:1070',
      state: 3,
    });
  });
  it('should listen to state change (FormaldehydeConcentrationMeasurement)', async () => {
    const clusterClients = new Map();
    clusterClients.set(FormaldehydeConcentrationMeasurement.Complete.id, {
      attributes: {
        measuredValue: {
          get: fake.resolves(100),
        },
      },
      addMeasuredValueAttributeListener: (callback) => {
        callback(100);
      },
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:1067',
      state: 100,
    });
  });
  it('should listen to state change (Thermostat heating)', async () => {
    const clusterClients = new Map();
    clusterClients.set(Thermostat.Complete.id, {
      supportedFeatures: {
        heating: true,
      },
      attributes: {
        occupiedHeatingSetpoint: {
          get: fake.resolves(2000),
        },
      },
      addOccupiedHeatingSetpointAttributeListener: (callback) => {
        callback(2000);
      },
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:513:heating',
      state: 20,
    });
  });
  it('should listen to state change (Thermostat cooling)', async () => {
    const clusterClients = new Map();
    clusterClients.set(Thermostat.Complete.id, {
      supportedFeatures: {
        cooling: true,
      },
      attributes: {
        occupiedCoolingSetpoint: {
          get: fake.resolves(2000),
        },
      },
      addOccupiedCoolingSetpointAttributeListener: (callback) => {
        callback(2000);
      },
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:513:cooling',
      state: 20,
    });
  });
  it('should listen to state change (WindowCovering)', async () => {
    const clusterClients = new Map();
    clusterClients.set(WindowCovering.Complete.id, {
      attributes: {
        currentPositionLiftPercent100ths: {
          get: fake.resolves(8400),
        },
      },
      addCurrentPositionLiftPercent100thsAttributeListener: (callback) => {
        callback(8400);
      },
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:258:position',
      state: 84,
    });
  });
  it('should listen to state change (LevelControl)', async () => {
    const clusterClients = new Map();
    clusterClients.set(LevelControl.Complete.id, {
      attributes: {
        currentLevel: {
          get: fake.resolves(99),
        },
      },
      addCurrentLevelAttributeListener: (callback) => {
        callback(99);
      },
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:8',
      state: 99,
    });
  });
  it('should listen to state change (ColorControl)', async () => {
    const clusterClients = new Map();
    clusterClients.set(ColorControl.Complete.id, {
      supportedFeatures: {
        hueSaturation: true,
      },
      attributes: {
        currentHue: {
          get: fake.resolves(100),
        },
        currentSaturation: {
          get: fake.resolves(40),
        },
      },
      addCurrentHueAttributeListener: (callback) => {
        callback(100);
      },
      addCurrentSaturationAttributeListener: (callback) => {
        callback(40);
      },
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    // Initial cached state emit + 2 listener callbacks = 3 calls total
    // But the listener callbacks also call emitColorState which reads from cache
    assert.called(gladys.event.emit);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:768:color',
      state: 14090213,
    });
  });
  it('should listen to state change (ElectricalPowerMeasurement - ActivePower)', async () => {
    const clusterClients = new Map();
    clusterClients.set(ElectricalPowerMeasurement.Complete.id, {
      attributes: {
        activePower: {
          get: fake.resolves(1500000),
        },
      },
      addActivePowerAttributeListener: (callback) => {
        callback(1500000); // 1500000 mW = 1500 W
      },
      addVoltageAttributeListener: () => {},
      addActiveCurrentAttributeListener: () => {},
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:144:power',
      state: 1500,
    });
  });
  it('should listen to state change (ElectricalPowerMeasurement - Voltage)', async () => {
    const clusterClients = new Map();
    clusterClients.set(ElectricalPowerMeasurement.Complete.id, {
      supportedFeatures: {
        voltage: true,
      },
      attributes: {
        activePower: {
          get: fake.resolves(0),
        },
        voltage: {
          get: fake.resolves(230000),
        },
      },
      addActivePowerAttributeListener: () => {},
      addVoltageAttributeListener: (callback) => {
        callback(230000); // 230000 mV = 230 V
      },
      addActiveCurrentAttributeListener: () => {},
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:144:voltage',
      state: 230,
    });
  });
  it('should listen to state change (ElectricalPowerMeasurement - ActiveCurrent)', async () => {
    const clusterClients = new Map();
    clusterClients.set(ElectricalPowerMeasurement.Complete.id, {
      supportedFeatures: {
        current: true,
      },
      attributes: {
        activePower: {
          get: fake.resolves(0),
        },
        activeCurrent: {
          get: fake.resolves(6500),
        },
      },
      addActivePowerAttributeListener: () => {},
      addVoltageAttributeListener: () => {},
      addActiveCurrentAttributeListener: (callback) => {
        callback(6500); // 6500 mA = 6.5 A
      },
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:144:current',
      state: 6.5,
    });
  });
  it('should listen to state change (ElectricalEnergyMeasurement - CumulativeEnergy)', async () => {
    const clusterClients = new Map();
    clusterClients.set(ElectricalEnergyMeasurement.Complete.id, {
      supportedFeatures: {
        cumulativeEnergy: true,
      },
      attributes: {
        cumulativeEnergyImported: {
          get: fake.resolves({ energy: 1500000000 }),
        },
      },
      addCumulativeEnergyImportedAttributeListener: (callback) => {
        callback({ energy: 1500000000 }); // 1500000000 mWh = 1500 kWh
      },
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:145:energy',
      state: 1500,
    });
  });

  // Test cached read error handling
  it('should handle cached read error gracefully (OnOff)', async () => {
    const clusterClients = new Map();
    clusterClients.set(OnOff.Complete.id, {
      attributes: {
        onOff: {
          get: fake.rejects(new Error('Cache read failed')),
        },
      },
      addOnOffAttributeListener: fake.returns(null),
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    // Should not throw
    await matterHandler.listenToStateChange(1234n, '1', device);
    // Listener should still be added
    assert.calledOnce(clusterClients.get(OnOff.Complete.id).addOnOffAttributeListener);
  });

  // Test null cached value
  it('should not emit state when cached value is null (OnOff)', async () => {
    const clusterClients = new Map();
    clusterClients.set(OnOff.Complete.id, {
      attributes: {
        onOff: {
          get: fake.resolves(null),
        },
      },
      addOnOffAttributeListener: fake.returns(null),
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    // Should not emit any state since cached is null
    assert.notCalled(gladys.event.emit);
  });

  // Test undefined cached value
  it('should not emit state when cached value is undefined (Occupancy)', async () => {
    const clusterClients = new Map();
    clusterClients.set(OccupancySensing.Complete.id, {
      attributes: {
        occupancy: {
          get: fake.resolves(undefined),
        },
      },
      addOccupancyAttributeListener: fake.returns(null),
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.notCalled(gladys.event.emit);
  });

  // Test stateChangeListeners already has cluster (skip adding listener)
  it('should not add listener twice for same cluster', async () => {
    const onOffCluster = {
      attributes: {
        onOff: {
          get: fake.resolves(true),
        },
      },
      addOnOffAttributeListener: fake.returns(null),
    };
    const clusterClients = new Map();
    clusterClients.set(OnOff.Complete.id, onOffCluster);
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    // First call - should add listener
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledOnce(onOffCluster.addOnOffAttributeListener);
    // Second call - should NOT add listener again
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledOnce(onOffCluster.addOnOffAttributeListener);
  });

  // Test ColorControl with null hue/saturation
  it('should not emit color state when hue is null', async () => {
    const clusterClients = new Map();
    clusterClients.set(ColorControl.Complete.id, {
      supportedFeatures: {
        hueSaturation: true,
      },
      attributes: {
        currentHue: {
          get: fake.resolves(null),
        },
        currentSaturation: {
          get: fake.resolves(40),
        },
      },
      addCurrentHueAttributeListener: fake.returns(null),
      addCurrentSaturationAttributeListener: fake.returns(null),
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    // Should not emit because hue is null
    assert.notCalled(gladys.event.emit);
  });

  // Test ColorControl with hueSaturation feature disabled
  it('should not add hue/saturation listeners when feature not supported', async () => {
    const colorCluster = {
      supportedFeatures: {
        hueSaturation: false,
      },
      attributes: {
        currentHue: {
          get: fake.rejects(new Error('Not supported')),
        },
        currentSaturation: {
          get: fake.rejects(new Error('Not supported')),
        },
      },
      addCurrentHueAttributeListener: fake.returns(null),
      addCurrentSaturationAttributeListener: fake.returns(null),
    };
    const clusterClients = new Map();
    clusterClients.set(ColorControl.Complete.id, colorCluster);
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    // Should not add listeners because hueSaturation is false
    assert.notCalled(colorCluster.addCurrentHueAttributeListener);
    assert.notCalled(colorCluster.addCurrentSaturationAttributeListener);
  });

  // Test Thermostat with both heating and cooling
  it('should emit both heating and cooling states', async () => {
    const clusterClients = new Map();
    clusterClients.set(Thermostat.Complete.id, {
      supportedFeatures: {
        heating: true,
        cooling: true,
      },
      attributes: {
        occupiedHeatingSetpoint: {
          get: fake.resolves(2100),
        },
        occupiedCoolingSetpoint: {
          get: fake.resolves(2500),
        },
      },
      addOccupiedHeatingSetpointAttributeListener: fake.returns(null),
      addOccupiedCoolingSetpointAttributeListener: fake.returns(null),
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:513:heating',
      state: 21,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:513:cooling',
      state: 25,
    });
  });

  // Test ElectricalPowerMeasurement with voltage and current attributes
  it('should emit voltage and current states when attributes exist', async () => {
    const clusterClients = new Map();
    clusterClients.set(ElectricalPowerMeasurement.Complete.id, {
      attributes: {
        activePower: {
          get: fake.resolves(1500000),
        },
        voltage: {
          get: fake.resolves(230000),
        },
        activeCurrent: {
          get: fake.resolves(6500),
        },
      },
      addActivePowerAttributeListener: fake.returns(null),
      addVoltageAttributeListener: fake.returns(null),
      addActiveCurrentAttributeListener: fake.returns(null),
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:144:power',
      state: 1500,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:144:voltage',
      state: 230,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:144:current',
      state: 6.5,
    });
  });

  // Test ElectricalEnergyMeasurement with null energy
  it('should not emit energy state when energy is null', async () => {
    const clusterClients = new Map();
    clusterClients.set(ElectricalEnergyMeasurement.Complete.id, {
      supportedFeatures: {
        cumulativeEnergy: true,
      },
      attributes: {
        cumulativeEnergyImported: {
          get: fake.resolves({ energy: null }),
        },
      },
      addCumulativeEnergyImportedAttributeListener: fake.returns(null),
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.notCalled(gladys.event.emit);
  });

  // Test cached read error for all clusters
  it('should handle cached read error gracefully (IlluminanceMeasurement)', async () => {
    const clusterClients = new Map();
    clusterClients.set(IlluminanceMeasurement.Complete.id, {
      attributes: {
        measuredValue: {
          get: fake.rejects(new Error('Cache read failed')),
        },
      },
      addMeasuredValueAttributeListener: fake.returns(null),
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledOnce(clusterClients.get(IlluminanceMeasurement.Complete.id).addMeasuredValueAttributeListener);
  });

  // Test cached read error for WindowCovering
  it('should handle cached read error gracefully (WindowCovering)', async () => {
    const clusterClients = new Map();
    clusterClients.set(WindowCovering.Complete.id, {
      attributes: {
        currentPositionLiftPercent100ths: {
          get: fake.rejects(new Error('Cache read failed')),
        },
      },
      addCurrentPositionLiftPercent100thsAttributeListener: fake.returns(null),
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledOnce(clusterClients.get(WindowCovering.Complete.id).addCurrentPositionLiftPercent100thsAttributeListener);
  });

  // Test cached read error for LevelControl
  it('should handle cached read error gracefully (LevelControl)', async () => {
    const clusterClients = new Map();
    clusterClients.set(LevelControl.Complete.id, {
      attributes: {
        currentLevel: {
          get: fake.rejects(new Error('Cache read failed')),
        },
      },
      addCurrentLevelAttributeListener: fake.returns(null),
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledOnce(clusterClients.get(LevelControl.Complete.id).addCurrentLevelAttributeListener);
  });

  // Test cached read error for Thermostat
  it('should handle cached read error gracefully (Thermostat)', async () => {
    const clusterClients = new Map();
    clusterClients.set(Thermostat.Complete.id, {
      supportedFeatures: {
        heating: true,
        cooling: true,
      },
      attributes: {
        occupiedHeatingSetpoint: {
          get: fake.rejects(new Error('Cache read failed')),
        },
        occupiedCoolingSetpoint: {
          get: fake.rejects(new Error('Cache read failed')),
        },
      },
      addOccupiedHeatingSetpointAttributeListener: fake.returns(null),
      addOccupiedCoolingSetpointAttributeListener: fake.returns(null),
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledOnce(clusterClients.get(Thermostat.Complete.id).addOccupiedHeatingSetpointAttributeListener);
    assert.calledOnce(clusterClients.get(Thermostat.Complete.id).addOccupiedCoolingSetpointAttributeListener);
  });

  // Test cached read error for ElectricalPowerMeasurement
  it('should handle cached read error gracefully (ElectricalPowerMeasurement)', async () => {
    const clusterClients = new Map();
    clusterClients.set(ElectricalPowerMeasurement.Complete.id, {
      attributes: {
        activePower: {
          get: fake.rejects(new Error('Cache read failed')),
        },
      },
      addActivePowerAttributeListener: fake.returns(null),
      addVoltageAttributeListener: fake.returns(null),
      addActiveCurrentAttributeListener: fake.returns(null),
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledOnce(clusterClients.get(ElectricalPowerMeasurement.Complete.id).addActivePowerAttributeListener);
  });

  // Test cached read error for ElectricalEnergyMeasurement
  it('should handle cached read error gracefully (ElectricalEnergyMeasurement)', async () => {
    const clusterClients = new Map();
    clusterClients.set(ElectricalEnergyMeasurement.Complete.id, {
      supportedFeatures: {
        cumulativeEnergy: true,
      },
      attributes: {
        cumulativeEnergyImported: {
          get: fake.rejects(new Error('Cache read failed')),
        },
      },
      addCumulativeEnergyImportedAttributeListener: fake.returns(null),
    });
    const device = {
      number: 1,
      getClusterClientById: (id) => clusterClients.get(id),
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledOnce(clusterClients.get(ElectricalEnergyMeasurement.Complete.id).addCumulativeEnergyImportedAttributeListener);
  });
});
