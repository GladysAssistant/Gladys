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
      addOnOffAttributeListener: (callback) => {
        callback(true);
      },
    });
    const device = {
      number: 1,
      clusterClients,
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
      addOnOffAttributeListener: (callback) => {
        callback(false);
      },
    });
    const device = {
      number: 1,
      clusterClients,
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
      addOnOffAttributeListener: (callback) => {
        callback(false);
      },
    });
    const device = {
      number: 1,
      clusterClients,
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
      addOccupancyAttributeListener: (callback) => {
        callback({ occupied: true });
      },
    });
    const device = {
      number: 1,
      clusterClients,
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
      addOccupancyAttributeListener: (callback) => {
        callback({ occupied: false });
      },
    });
    const device = {
      number: 1,
      clusterClients,
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
      addMeasuredValueAttributeListener: (callback) => {
        callback(21327);
      },
    });
    const device = {
      number: 1,
      clusterClients,
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
      addMeasuredValueAttributeListener: (callback) => {
        callback(2150);
      },
    });
    const device = {
      number: 1,
      clusterClients,
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
      addMeasuredValueAttributeListener: (callback) => {
        callback(5000);
      },
    });
    const device = {
      number: 1,
      clusterClients,
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
      addMeasuredValueAttributeListener: (callback) => {
        callback(100);
      },
    });
    const device = {
      number: 1,
      clusterClients,
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:1066',
      state: 100,
    });
  });
  it('should listen to state change (Thermostat heating)', async () => {
    const clusterClients = new Map();
    clusterClients.set(Thermostat.Complete.id, {
      supportedFeatures: {
        heating: true,
      },
      addOccupiedHeatingSetpointAttributeListener: (callback) => {
        callback(2000);
      },
    });
    const device = {
      number: 1,
      clusterClients,
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
      addOccupiedCoolingSetpointAttributeListener: (callback) => {
        callback(2000);
      },
    });
    const device = {
      number: 1,
      clusterClients,
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
      addCurrentPositionLiftPercent100thsAttributeListener: (callback) => {
        callback(8400);
      },
    });
    const device = {
      number: 1,
      clusterClients,
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
      addCurrentLevelAttributeListener: (callback) => {
        callback(99);
      },
    });
    const device = {
      number: 1,
      clusterClients,
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:8',
      state: 99,
    });
  });
  it('should listen to state change (ColorControl)', async () => {
    const clusterClients = new Map();
    const promise = new Promise((resolve) => {
      let callCount = 0;
      const checkThatEveryThingWasCalled = () => {
        callCount += 1;
        if (callCount === 4) {
          resolve();
        }
      };
      clusterClients.set(ColorControl.Complete.id, {
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
      });
    });
    const device = {
      number: 1,
      clusterClients,
    };
    await matterHandler.listenToStateChange(1234n, '1', device);
    // We need to make sure that we called all 4 functions before checking the events
    await promise;
    assert.calledTwice(gladys.event.emit);
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:768:color',
      state: 14090213,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'matter:1234:1:768:color',
      state: 14090213,
    });
  });
});
