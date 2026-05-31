const sinon = require('sinon');
const { assert: chaiAssert } = require('chai');

const { fake, assert } = sinon;

const MatterHandler = require('../../../../services/matter/lib');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, COVER_STATE } = require('../../../../utils/constants');

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
  it('should control television media playback (play)', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.PLAY,
    };

    const value = 1;

    const clusterClients = new Map();

    const mediaPlayback = {
      play: fake.resolves(null),
      pause: fake.resolves(null),
      stop: fake.resolves(null),
    };
    clusterClients.set(1286, mediaPlayback);

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
    assert.calledOnce(mediaPlayback.play);
    assert.notCalled(mediaPlayback.pause);
    assert.notCalled(mediaPlayback.stop);
  });

  it('should control television media playback (pause)', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.PAUSE,
    };

    const value = 1;

    const clusterClients = new Map();

    const mediaPlayback = {
      play: fake.resolves(null),
      pause: fake.resolves(null),
      stop: fake.resolves(null),
    };
    clusterClients.set(1286, mediaPlayback);

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
    assert.calledOnce(mediaPlayback.pause);
    assert.notCalled(mediaPlayback.play);
    assert.notCalled(mediaPlayback.stop);
  });

  it('should control television media playback (stop)', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.STOP,
    };

    const value = 1;

    const clusterClients = new Map();

    const mediaPlayback = {
      play: fake.resolves(null),
      pause: fake.resolves(null),
      stop: fake.resolves(null),
    };
    clusterClients.set(1286, mediaPlayback);

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
    assert.calledOnce(mediaPlayback.stop);
    assert.notCalled(mediaPlayback.play);
    assert.notCalled(mediaPlayback.pause);
  });

  it('should control television volume', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.VOLUME,
    };

    const value = 42;

    const clusterClients = new Map();

    const levelControl = {
      moveToLevel: fake.resolves(null),
    };
    clusterClients.set(8, levelControl);

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
    assert.calledOnce(levelControl.moveToLevel);
    assert.calledWith(levelControl.moveToLevel, {
      level: value,
      transitionTime: null,
      optionsMask: {
        coupleColorTempToLevel: false,
        executeIfOff: true,
      },
      optionsOverride: {},
    });
  });

  it('should send television keypad UP key', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.UP,
    };

    const value = 1;

    const clusterClients = new Map();

    const keypadInput = {
      sendKey: fake.resolves(null),
    };
    clusterClients.set(1289, keypadInput);

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
    assert.calledOnce(keypadInput.sendKey);
    assert.calledWith(keypadInput.sendKey, { keyCode: 1 });
  });

  it('should send television keypad DOWN key', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.DOWN,
    };

    const value = 1;

    const clusterClients = new Map();

    const keypadInput = {
      sendKey: fake.resolves(null),
    };
    clusterClients.set(1289, keypadInput);

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
    assert.calledOnce(keypadInput.sendKey);
    assert.calledWith(keypadInput.sendKey, { keyCode: 2 });
  });

  it('should send television keypad LEFT key', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.LEFT,
    };

    const value = 1;

    const clusterClients = new Map();

    const keypadInput = {
      sendKey: fake.resolves(null),
    };
    clusterClients.set(1289, keypadInput);

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
    assert.calledOnce(keypadInput.sendKey);
    assert.calledWith(keypadInput.sendKey, { keyCode: 3 });
  });

  it('should send television keypad RIGHT key', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.RIGHT,
    };

    const value = 1;

    const clusterClients = new Map();

    const keypadInput = {
      sendKey: fake.resolves(null),
    };
    clusterClients.set(1289, keypadInput);

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
    assert.calledOnce(keypadInput.sendKey);
    assert.calledWith(keypadInput.sendKey, { keyCode: 4 });
  });

  it('should send television keypad ENTER key', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.ENTER,
    };

    const value = 1;

    const clusterClients = new Map();

    const keypadInput = {
      sendKey: fake.resolves(null),
    };
    clusterClients.set(1289, keypadInput);

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
    assert.calledOnce(keypadInput.sendKey);
    assert.calledWith(keypadInput.sendKey, { keyCode: 43 });
  });

  it('should send television keypad RETURN key', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.RETURN,
    };

    const value = 1;

    const clusterClients = new Map();

    const keypadInput = {
      sendKey: fake.resolves(null),
    };
    clusterClients.set(1289, keypadInput);

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
    assert.calledOnce(keypadInput.sendKey);
    assert.calledWith(keypadInput.sendKey, { keyCode: 13 });
  });

  it('should return an error if television media playback cluster is missing', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.PLAY,
    };

    const value = 1;
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
    await chaiAssert.isRejected(promise, 'Device does not support MediaPlayback cluster');
  });

  it('should not call media playback commands when value is not 1', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.PLAY,
    };

    const value = 0;
    const clusterClients = new Map();

    const mediaPlayback = {
      play: fake.resolves(null),
      pause: fake.resolves(null),
      stop: fake.resolves(null),
    };
    clusterClients.set(1286, mediaPlayback);

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
    assert.notCalled(mediaPlayback.play);
    assert.notCalled(mediaPlayback.pause);
    assert.notCalled(mediaPlayback.stop);
  });

  it('should return an error if television volume cluster is missing', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.VOLUME,
    };

    const value = 42;
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
    await chaiAssert.isRejected(promise, 'Device does not support LevelControl cluster');
  });

  it('should return an error if television keypad cluster is missing', async () => {
    const gladysDevice = {
      external_id: 'matter:12345:1',
    };

    const gladysFeature = {
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.UP,
    };

    const value = 1;
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
    await chaiAssert.isRejected(promise, 'Device does not support KeypadInput cluster');
  });
});
