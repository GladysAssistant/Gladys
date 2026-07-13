const sinon = require('sinon');
const { assert: chaiAssert } = require('chai');

const { fake, assert } = sinon;

// eslint-disable-next-line import/no-unresolved
const { FanControl } = require('@matter/main/clusters');

const MatterHandler = require('../../../../services/matter/lib');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  COVER_STATE,
  FAN_MODE,
  FAN_AIRFLOW_DIRECTION,
} = require('../../../../utils/constants');

describe('Matter.setValue', () => {
  let matterHandler;

  beforeEach(() => {
    const gladys = {
      job: {
        wrapper: fake.returns(null),
      },
    };
    const MatterMain = {};
    const ProjectChipMatter = {};

    matterHandler = new MatterHandler(gladys, MatterMain, ProjectChipMatter, 'service-1');
  });

  it('should turn on a binary device', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      type: 'binary',
    };

    const value = 1;

    const clusterClients = new Map();

    const clusterClient = {
      on: fake.resolves(null),
      off: fake.resolves(null),
    };
    clusterClients.set(6, clusterClient);

    matterHandler.nodesMap.set(12345n, {
      isConnected: false,
      connect: fake.resolves(null),
      events: {
        initialized: new Promise((resolve) => {
          resolve();
        }),
      },
      getDevices: fake.returns([
        {
          number: 1,
          getClusterClientById: (id) => clusterClients.get(id),
          getChildEndpoints: () => [],
        },
      ]),
    });

    await matterHandler.setValue(gladysDevice, gladysFeature, value);
    assert.calledOnce(clusterClient.on);
    assert.notCalled(clusterClient.off);
  });
  it('should turn off a binary device', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      type: 'binary',
    };

    const value = 0;

    const clusterClients = new Map();

    const clusterClient = {
      on: fake.resolves(null),
      off: fake.resolves(null),
    };
    clusterClients.set(6, clusterClient);

    matterHandler.nodesMap.set(12345n, {
      isConnected: false,
      connect: fake.resolves(null),
      events: {
        initialized: new Promise((resolve) => {
          resolve();
        }),
      },
      getDevices: fake.returns([
        {
          number: 1,
          getClusterClientById: (id) => clusterClients.get(id),
          getChildEndpoints: () => [],
        },
      ]),
    });

    await matterHandler.setValue(gladysDevice, gladysFeature, value);
    assert.notCalled(clusterClient.on);
    assert.calledOnce(clusterClient.off);
  });
  it('should turn off a child endpoint of a binary device', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1:child_endpoint:2:child_endpoint:2',
    };

    const gladysFeature = {
      type: 'binary',
    };

    const value = 0;

    const clusterClients = new Map();

    const clusterClient = {
      on: fake.resolves(null),
      off: fake.resolves(null),
    };

    clusterClients.set(6, clusterClient);

    matterHandler.nodesMap.set(12345n, {
      isConnected: false,
      connect: fake.resolves(null),
      events: {
        initialized: new Promise((resolve) => {
          resolve();
        }),
      },
      getDevices: fake.returns([
        {
          number: 1,
          getClusterClientById: () => null,
          getChildEndpoints: () => [
            {
              number: 2,
              getClusterClientById: () => null,
              getChildEndpoints: () => [
                {
                  number: 2,
                  getClusterClientById: (id) => clusterClients.get(id),
                  getChildEndpoints: () => [],
                },
              ],
            },
          ],
        },
      ]),
    });

    await matterHandler.setValue(gladysDevice, gladysFeature, value);
    assert.notCalled(clusterClient.on);
    assert.calledOnce(clusterClient.off);
  });
  it('should set the percentage of a shutter (position)', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
      type: DEVICE_FEATURE_TYPES.SHUTTER.POSITION,
    };

    const value = 80;

    const clusterClients = new Map();

    const clusterClient = {
      goToLiftPercentage: fake.resolves(null),
    };
    clusterClients.set(258, clusterClient);

    matterHandler.nodesMap.set(12345n, {
      isConnected: false,
      connect: fake.resolves(null),
      events: {
        initialized: new Promise((resolve) => {
          resolve();
        }),
      },
      getDevices: fake.returns([
        {
          number: 1,
          getClusterClientById: (id) => clusterClients.get(id),
          getChildEndpoints: () => [],
        },
      ]),
    });

    await matterHandler.setValue(gladysDevice, gladysFeature, value);
    assert.calledWith(clusterClient.goToLiftPercentage, { liftPercent100thsValue: 8000 });
  });
  it('should control of a shutter (state)', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
      type: DEVICE_FEATURE_TYPES.SHUTTER.STATE,
    };

    const clusterClients = new Map();

    const clusterClient = {
      upOrOpen: fake.resolves(null),
      downOrClose: fake.resolves(null),
      stopMotion: fake.resolves(null),
    };

    clusterClients.set(258, clusterClient);

    matterHandler.nodesMap.set(12345n, {
      isConnected: false,
      connect: fake.resolves(null),
      events: {
        initialized: new Promise((resolve) => {
          resolve();
        }),
      },
      getDevices: fake.returns([
        {
          number: 1,
          getClusterClientById: (id) => clusterClients.get(id),
          getChildEndpoints: () => [],
        },
      ]),
    });

    await matterHandler.setValue(gladysDevice, gladysFeature, COVER_STATE.OPEN);
    assert.called(clusterClient.upOrOpen);
    await matterHandler.setValue(gladysDevice, gladysFeature, COVER_STATE.CLOSE);
    assert.called(clusterClient.downOrClose);
    await matterHandler.setValue(gladysDevice, gladysFeature, COVER_STATE.STOP);
    assert.called(clusterClient.stopMotion);
  });
  it('should control a light brightness', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
    };

    const value = 150;

    const clusterClients = new Map();

    const clusterClient = {
      moveToLevel: fake.resolves(null),
    };
    clusterClients.set(8, clusterClient);

    const onOff = {
      on: fake.resolves(null),
    };
    clusterClients.set(6, onOff);

    matterHandler.nodesMap.set(12345n, {
      isConnected: false,
      connect: fake.resolves(null),
      events: {
        initialized: new Promise((resolve) => {
          resolve();
        }),
      },
      getDevices: fake.returns([
        {
          number: 1,
          getClusterClientById: (id) => clusterClients.get(id),
          getChildEndpoints: () => [],
        },
      ]),
    });

    await matterHandler.setValue(gladysDevice, gladysFeature, value);
    assert.calledWith(clusterClient.moveToLevel, {
      level: value,
      transitionTime: null,
      optionsMask: {
        coupleColorTempToLevel: false,
        executeIfOff: true,
      },
      optionsOverride: {},
    });
    assert.calledOnce(onOff.on);
  });
  it('should set light brightness without turning on when level is zero', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
    };

    const clusterClients = new Map();

    const clusterClient = {
      moveToLevel: fake.resolves(null),
    };
    clusterClients.set(8, clusterClient);

    const onOff = {
      on: fake.resolves(null),
    };
    clusterClients.set(6, onOff);

    matterHandler.nodesMap.set(12345n, {
      isConnected: true,
      getDevices: fake.returns([
        {
          number: 1,
          getClusterClientById: (id) => clusterClients.get(id),
          getChildEndpoints: () => [],
        },
      ]),
    });

    await matterHandler.setValue(gladysDevice, gladysFeature, 0);

    assert.calledOnce(clusterClient.moveToLevel);
    assert.notCalled(onOff.on);
  });
  it('should stop a shutter', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
      type: DEVICE_FEATURE_TYPES.SHUTTER.STATE,
    };

    const clusterClient = {
      stopMotion: fake.resolves(null),
    };

    matterHandler.nodesMap.set(12345n, {
      isConnected: true,
      getDevices: fake.returns([
        {
          number: 1,
          getClusterClientById: () => clusterClient,
          getChildEndpoints: () => [],
        },
      ]),
    });

    await matterHandler.setValue(gladysDevice, gladysFeature, COVER_STATE.STOP);

    assert.calledOnce(clusterClient.stopMotion);
  });
  it('should ignore unknown shutter state values', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
      type: DEVICE_FEATURE_TYPES.SHUTTER.STATE,
    };

    const clusterClient = {
      upOrOpen: fake.resolves(null),
      downOrClose: fake.resolves(null),
      stopMotion: fake.resolves(null),
    };

    matterHandler.nodesMap.set(12345n, {
      isConnected: true,
      getDevices: fake.returns([
        {
          number: 1,
          getClusterClientById: () => clusterClient,
          getChildEndpoints: () => [],
        },
      ]),
    });

    await matterHandler.setValue(gladysDevice, gladysFeature, 99);

    assert.notCalled(clusterClient.upOrOpen);
    assert.notCalled(clusterClient.downOrClose);
    assert.notCalled(clusterClient.stopMotion);
  });
  it('should control a light color', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    };

    const value = 14090213;

    const clusterClients = new Map();

    const clusterClient = {
      moveToHueAndSaturation: fake.resolves(null),
      supportedFeatures: {
        hueSaturation: true,
      },
    };
    clusterClients.set(768, clusterClient);
    const onOff = {
      on: fake.resolves(null),
    };
    clusterClients.set(6, onOff);

    matterHandler.nodesMap.set(12345n, {
      isConnected: false,
      connect: fake.resolves(null),
      events: {
        initialized: new Promise((resolve) => {
          resolve();
        }),
      },
      getDevices: fake.returns([
        {
          number: 1,
          getClusterClientById: (id) => clusterClients.get(id),
          getChildEndpoints: () => [],
        },
      ]),
    });

    await matterHandler.setValue(gladysDevice, gladysFeature, value);
    assert.calledWith(clusterClient.moveToHueAndSaturation, {
      hue: 100,
      saturation: 41,
      transitionTime: 0,
      optionsMask: 1,
      optionsOverride: 1,
    });
    assert.calledOnce(onOff.on);
  });
  it('should control a thermostat target temperature (heating)', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
      type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
    };

    const value = 25;

    const clusterClients = new Map();

    const clusterClient = {
      setOccupiedHeatingSetpointAttribute: fake.resolves(null),
    };
    clusterClients.set(513, clusterClient);

    matterHandler.nodesMap.set(12345n, {
      isConnected: false,
      connect: fake.resolves(null),
      events: {
        initialized: new Promise((resolve) => {
          resolve();
        }),
      },
      getDevices: fake.returns([
        {
          number: 1,
          getClusterClientById: (id) => clusterClients.get(id),
          getChildEndpoints: () => [],
        },
      ]),
    });

    await matterHandler.setValue(gladysDevice, gladysFeature, value);
    assert.calledWith(clusterClient.setOccupiedHeatingSetpointAttribute, value * 100);
  });
  it('should control a thermostat target temperature (cooling)', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
      type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE,
    };

    const value = 25;

    const clusterClients = new Map();

    const clusterClient = {
      setOccupiedCoolingSetpointAttribute: fake.resolves(null),
    };
    clusterClients.set(513, clusterClient);

    matterHandler.nodesMap.set(12345n, {
      isConnected: false,
      connect: fake.resolves(null),
      events: {
        initialized: new Promise((resolve) => {
          resolve();
        }),
      },
      getDevices: fake.returns([
        {
          number: 1,
          getClusterClientById: (id) => clusterClients.get(id),
          getChildEndpoints: () => [],
        },
      ]),
    });

    await matterHandler.setValue(gladysDevice, gladysFeature, value);
    assert.calledWith(clusterClient.setOccupiedCoolingSetpointAttribute, value * 100);
  });
  it('should return an error, no node found', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      type: 'binary',
    };

    const value = 0;

    const promise = matterHandler.setValue(gladysDevice, gladysFeature, value);
    await chaiAssert.isRejected(promise, 'Node 12345 not found');
  });
  it('should return an error if the device is not found', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      type: 'binary',
    };

    const value = 0;

    matterHandler.nodesMap.set(12345n, {
      isConnected: false,
      connect: fake.resolves(null),
      events: {
        initialized: new Promise((resolve) => {
          resolve();
        }),
      },
      getDevices: fake.returns([]),
    });

    const promise = matterHandler.setValue(gladysDevice, gladysFeature, value);
    await chaiAssert.isRejected(promise, 'No devices found for node 12345');
  });
  it('should return an error if the device does not support the OnOff cluster', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      type: 'binary',
    };

    const value = 0;

    const clusterClients = new Map();

    matterHandler.nodesMap.set(12345n, {
      isConnected: false,
      connect: fake.resolves(null),
      events: {
        initialized: new Promise((resolve) => {
          resolve();
        }),
      },
      getDevices: fake.returns([
        {
          number: 1,
          getClusterClientById: (id) => clusterClients.get(id),
          getChildEndpoints: () => [],
        },
      ]),
    });

    const promise = matterHandler.setValue(gladysDevice, gladysFeature, value);
    await chaiAssert.isRejected(promise, 'Device does not support OnOff cluster');
  });
  it('should return an error, root device not found', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:2',
    };

    const gladysFeature = {
      type: 'binary',
    };

    const value = 0;

    const clusterClients = new Map();

    matterHandler.nodesMap.set(12345n, {
      isConnected: false,
      connect: fake.resolves(null),
      events: {
        initialized: new Promise((resolve) => {
          resolve();
        }),
      },
      getDevices: fake.returns([
        {
          number: 1,
          getClusterClientById: (id) => clusterClients.get(id),
          getChildEndpoints: () => [],
        },
      ]),
    });

    const promise = matterHandler.setValue(gladysDevice, gladysFeature, value);
    await chaiAssert.isRejected(promise, 'Root device 2 not found');
  });
  it('should return an error, child endpoint not found', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1:child_endpoint:2',
    };

    const gladysFeature = {
      type: 'binary',
    };

    const value = 0;

    const clusterClients = new Map();

    matterHandler.nodesMap.set(12345n, {
      isConnected: false,
      connect: fake.resolves(null),
      events: {
        initialized: new Promise((resolve) => {
          resolve();
        }),
      },
      getDevices: fake.returns([
        {
          number: 1,
          getClusterClientById: (id) => clusterClients.get(id),
          getChildEndpoints: () => [
            {
              number: 1,
              getClusterClientById: (id) => clusterClients.get(id),
              getChildEndpoints: () => [],
            },
          ],
        },
      ]),
    });

    const promise = matterHandler.setValue(gladysDevice, gladysFeature, value);
    await chaiAssert.isRejected(promise, 'Device not found for path 1:child_endpoint:2');
  });
  it('should return an error when device has no child endpoints', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1:2',
    };

    const gladysFeature = {
      type: 'binary',
    };

    matterHandler.nodesMap.set(12345n, {
      isConnected: true,
      getDevices: fake.returns([
        {
          number: 1,
          getClusterClientById: () => null,
          getChildEndpoints: () => [],
        },
      ]),
    });

    const promise = matterHandler.setValue(gladysDevice, gladysFeature, 1);
    await chaiAssert.isRejected(promise, 'Device not found for path 1:2');
  });
  it('should set fan mode', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.FAN,
      type: DEVICE_FEATURE_TYPES.FAN.MODE,
      external_id: `matter:12345:1:${FanControl.Complete.id}:mode`,
    };

    const clusterClient = {
      setFanModeAttribute: fake.resolves(null),
      setPercentSettingAttribute: fake.resolves(null),
      setSpeedSettingAttribute: fake.resolves(null),
      setRockSettingAttribute: fake.resolves(null),
      setWindSettingAttribute: fake.resolves(null),
      setAirflowDirectionAttribute: fake.resolves(null),
    };
    const clusterClients = new Map();
    clusterClients.set(FanControl.Complete.id, clusterClient);

    matterHandler.nodesMap.set(12345n, {
      isConnected: true,
      getDevices: fake.returns([
        {
          number: 1,
          getClusterClientById: (id) => clusterClients.get(id),
          getChildEndpoints: () => [],
        },
      ]),
    });

    await matterHandler.setValue(gladysDevice, gladysFeature, FAN_MODE.AUTO);
    assert.calledOnceWithExactly(clusterClient.setFanModeAttribute, 5);
  });
  it('should set fan percent speed', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.FAN,
      type: DEVICE_FEATURE_TYPES.FAN.PERCENT,
      external_id: `matter:12345:1:${FanControl.Complete.id}:percent`,
    };

    const clusterClient = {
      setFanModeAttribute: fake.resolves(null),
      setPercentSettingAttribute: fake.resolves(null),
    };
    const clusterClients = new Map();
    clusterClients.set(FanControl.Complete.id, clusterClient);

    matterHandler.nodesMap.set(12345n, {
      isConnected: true,
      getDevices: fake.returns([
        {
          number: 1,
          getClusterClientById: (id) => clusterClients.get(id),
          getChildEndpoints: () => [],
        },
      ]),
    });

    await matterHandler.setValue(gladysDevice, gladysFeature, 75);
    assert.calledOnceWithExactly(clusterClient.setPercentSettingAttribute, 75);
  });
  it('should set fan airflow direction', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.FAN,
      type: DEVICE_FEATURE_TYPES.FAN.AIRFLOW_DIRECTION,
      external_id: `matter:12345:1:${FanControl.Complete.id}:airflow-direction`,
    };

    const clusterClient = {
      setAirflowDirectionAttribute: fake.resolves(null),
    };
    const clusterClients = new Map();
    clusterClients.set(FanControl.Complete.id, clusterClient);

    matterHandler.nodesMap.set(12345n, {
      isConnected: true,
      getDevices: fake.returns([
        {
          number: 1,
          getClusterClientById: (id) => clusterClients.get(id),
          getChildEndpoints: () => [],
        },
      ]),
    });

    await matterHandler.setValue(gladysDevice, gladysFeature, FAN_AIRFLOW_DIRECTION.REVERSE);
    assert.calledOnceWithExactly(clusterClient.setAirflowDirectionAttribute, FAN_AIRFLOW_DIRECTION.REVERSE);
  });

  it('should set fan speed, rock and wind settings', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const clusterClient = {
      setSpeedSettingAttribute: fake.resolves(null),
      setRockSettingAttribute: fake.resolves(null),
      setWindSettingAttribute: fake.resolves(null),
    };
    const clusterClients = new Map();
    clusterClients.set(FanControl.Complete.id, clusterClient);

    matterHandler.nodesMap.set(12345n, {
      isConnected: true,
      getDevices: fake.returns([
        {
          number: 1,
          getClusterClientById: (id) => clusterClients.get(id),
          getChildEndpoints: () => [],
        },
      ]),
    });

    await matterHandler.setValue(
      gladysDevice,
      {
        category: DEVICE_FEATURE_CATEGORIES.FAN,
        type: DEVICE_FEATURE_TYPES.FAN.SPEED,
        external_id: `matter:12345:1:${FanControl.Complete.id}:speed`,
      },
      5,
    );
    assert.calledOnceWithExactly(clusterClient.setSpeedSettingAttribute, 5);

    await matterHandler.setValue(
      gladysDevice,
      {
        category: DEVICE_FEATURE_CATEGORIES.FAN,
        type: DEVICE_FEATURE_TYPES.FAN.ROCK_SETTING,
        external_id: `matter:12345:1:${FanControl.Complete.id}:rock`,
      },
      1,
    );
    assert.calledOnceWithExactly(clusterClient.setRockSettingAttribute, { rockLeftRight: true });

    await matterHandler.setValue(
      gladysDevice,
      {
        category: DEVICE_FEATURE_CATEGORIES.FAN,
        type: DEVICE_FEATURE_TYPES.FAN.WIND_SETTING,
        external_id: `matter:12345:1:${FanControl.Complete.id}:wind`,
      },
      2,
    );
    assert.calledOnceWithExactly(clusterClient.setWindSettingAttribute, { naturalWind: true });
  });

  it('should return an error when fan control cluster is missing', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.FAN,
      type: DEVICE_FEATURE_TYPES.FAN.MODE,
      external_id: `matter:12345:1:${FanControl.Complete.id}:mode`,
    };

    matterHandler.nodesMap.set(12345n, {
      isConnected: true,
      getDevices: fake.returns([
        {
          number: 1,
          getClusterClientById: () => null,
          getChildEndpoints: () => [],
        },
      ]),
    });

    const promise = matterHandler.setValue(gladysDevice, gladysFeature, FAN_MODE.LOW);
    await chaiAssert.isRejected(promise, 'Device does not support FanControl cluster');
  });

  it('should return an error for unsupported fan feature suffix', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.FAN,
      type: DEVICE_FEATURE_TYPES.FAN.MODE,
      external_id: `matter:12345:1:${FanControl.Complete.id}:invalid`,
    };

    const clusterClient = {
      setFanModeAttribute: fake.resolves(null),
    };
    const clusterClients = new Map();
    clusterClients.set(FanControl.Complete.id, clusterClient);

    matterHandler.nodesMap.set(12345n, {
      isConnected: true,
      getDevices: fake.returns([
        {
          number: 1,
          getClusterClientById: (id) => clusterClients.get(id),
          getChildEndpoints: () => [],
        },
      ]),
    });

    const promise = matterHandler.setValue(gladysDevice, gladysFeature, 0);
    await chaiAssert.isRejected(promise, 'Unsupported FanControl feature suffix: invalid');
  });
  it('should send vacuum cleaner to dock', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1:child_endpoint:2',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.VACUUM_CLEANER,
      type: DEVICE_FEATURE_TYPES.VACUUM_CLEANER.DOCK,
    };

    const value = 1;

    const clusterClients = new Map();

    const rvcOperationalStateCluster = {
      goHome: fake.resolves(null),
    };
    clusterClients.set(97, rvcOperationalStateCluster);

    matterHandler.nodesMap.set(12345n, {
      isConnected: true,
      getDevices: fake.returns([
        {
          number: 1,
          getChildEndpoints: () => [
            {
              number: 2,
              getClusterClientById: (id) => clusterClients.get(id),
              getChildEndpoints: () => [],
            },
          ],
        },
      ]),
    });

    await matterHandler.setValue(gladysDevice, gladysFeature, value);
    assert.calledOnce(rvcOperationalStateCluster.goHome);
  });
  it('should throw error when dock value is not 1', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1:child_endpoint:2',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.VACUUM_CLEANER,
      type: DEVICE_FEATURE_TYPES.VACUUM_CLEANER.DOCK,
    };

    const value = 0;

    const clusterClients = new Map();

    const rvcOperationalStateCluster = {
      goHome: fake.resolves(null),
    };
    clusterClients.set(97, rvcOperationalStateCluster);

    matterHandler.nodesMap.set(12345n, {
      isConnected: true,
      getDevices: fake.returns([
        {
          number: 1,
          getChildEndpoints: () => [
            {
              number: 2,
              getClusterClientById: (id) => clusterClients.get(id),
              getChildEndpoints: () => [],
            },
          ],
        },
      ]),
    });

    const promise = matterHandler.setValue(gladysDevice, gladysFeature, value);
    await chaiAssert.isRejected(promise, 'Unsupported dock command value: 0. Only value 1 (go home) is supported.');
    assert.notCalled(rvcOperationalStateCluster.goHome);
  });
  it('should change vacuum cleaner run mode', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:2',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.VACUUM_CLEANER,
      type: DEVICE_FEATURE_TYPES.VACUUM_CLEANER.RUN_MODE,
    };

    const value = 1;

    const clusterClients = new Map();

    const rvcRunModeCluster = {
      changeToMode: fake.resolves(null),
    };
    clusterClients.set(84, rvcRunModeCluster);

    matterHandler.nodesMap.set(12345n, {
      isConnected: true,
      getDevices: fake.returns([
        {
          number: 2,
          getClusterClientById: (id) => clusterClients.get(id),
          getChildEndpoints: () => [],
        },
      ]),
    });

    await matterHandler.setValue(gladysDevice, gladysFeature, value);
    assert.calledOnceWithExactly(rvcRunModeCluster.changeToMode, { newMode: 1 });
  });
  it('should change vacuum cleaner clean mode', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:2',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.VACUUM_CLEANER,
      type: DEVICE_FEATURE_TYPES.VACUUM_CLEANER.CLEAN_MODE,
    };

    const value = 2;

    const clusterClients = new Map();

    const rvcCleanModeCluster = {
      changeToMode: fake.resolves(null),
    };
    clusterClients.set(85, rvcCleanModeCluster);

    matterHandler.nodesMap.set(12345n, {
      isConnected: true,
      getDevices: fake.returns([
        {
          number: 2,
          getClusterClientById: (id) => clusterClients.get(id),
          getChildEndpoints: () => [],
        },
      ]),
    });

    await matterHandler.setValue(gladysDevice, gladysFeature, value);
    assert.calledOnceWithExactly(rvcCleanModeCluster.changeToMode, { newMode: 2 });
  });
  it('should throw error when RvcOperationalState cluster is not available for dock', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:2',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.VACUUM_CLEANER,
      type: DEVICE_FEATURE_TYPES.VACUUM_CLEANER.DOCK,
    };

    const value = 1;

    const clusterClients = new Map();

    matterHandler.nodesMap.set(12345n, {
      isConnected: true,
      getDevices: fake.returns([
        {
          number: 2,
          getClusterClientById: (id) => clusterClients.get(id),
          getChildEndpoints: () => [],
        },
      ]),
    });

    const promise = matterHandler.setValue(gladysDevice, gladysFeature, value);
    await chaiAssert.isRejected(promise, 'Device does not support RvcOperationalState cluster');
  });
  it('should throw error when RvcRunMode cluster is not available', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:2',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.VACUUM_CLEANER,
      type: DEVICE_FEATURE_TYPES.VACUUM_CLEANER.RUN_MODE,
    };

    const value = 1;

    const clusterClients = new Map();

    matterHandler.nodesMap.set(12345n, {
      isConnected: true,
      getDevices: fake.returns([
        {
          number: 2,
          getClusterClientById: (id) => clusterClients.get(id),
          getChildEndpoints: () => [],
        },
      ]),
    });

    const promise = matterHandler.setValue(gladysDevice, gladysFeature, value);
    await chaiAssert.isRejected(promise, 'Device does not support RvcRunMode cluster');
  });
  it('should throw error when RvcCleanMode cluster is not available', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:2',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.VACUUM_CLEANER,
      type: DEVICE_FEATURE_TYPES.VACUUM_CLEANER.CLEAN_MODE,
    };

    const value = 1;

    const clusterClients = new Map();

    matterHandler.nodesMap.set(12345n, {
      isConnected: true,
      getDevices: fake.returns([
        {
          number: 2,
          getClusterClientById: (id) => clusterClients.get(id),
          getChildEndpoints: () => [],
        },
      ]),
    });

    const promise = matterHandler.setValue(gladysDevice, gladysFeature, value);
    await chaiAssert.isRejected(promise, 'Device does not support RvcCleanMode cluster');
  });
});
