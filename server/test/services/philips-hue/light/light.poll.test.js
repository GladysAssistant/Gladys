const { expect } = require('chai');
const { assert, fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const { MockedPhilipsHueClient, hueApiHsColorMode, hueApiCtColorMode } = require('../mocks.test');
const { EVENTS } = require('../../../../utils/constants');

const PhilipsHueService = proxyquire('../../../../services/philips-hue/index', {
  'node-hue-api': MockedPhilipsHueClient,
});

const deviceManager = {
  get: fake.resolves([
    {
      id: '87d03a3e-5540-4dd1-85cc-be86578118c4',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      room_id: null,
      name: 'Philips Hue Bridge',
      selector: 'philips-hue-bridge-1234',
      model: 'philips-hue-bridge',
      external_id: 'philips-hue:bridge:1234',
      should_poll: false,
      poll_frequency: null,
      features: [],
      params: [
        {
          id: 'b6cc79bd-7080-4204-9631-131a7aba0b76',
          device_id: '87d03a3e-5540-4dd1-85cc-be86578118c4',
          name: 'BRIDGE_IP_ADDRESS',
          value: '192.168.2.245',
        },
        {
          id: '5d9f76db-e23b-46c0-9d93-36c7f9b494b4',
          device_id: '87d03a3e-5540-4dd1-85cc-be86578118c4',
          name: 'BRIDGE_USERNAME',
          value: 'username',
        },
        {
          id: '5cfc35c3-06a0-493e-955a-d3854b0c649d',
          device_id: '87d03a3e-5540-4dd1-85cc-be86578118c4',
          name: 'BRIDGE_SERIAL_NUMBER',
          value: '1234',
        },
      ],
      room: null,
      service: {
        id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
        pod_id: null,
        name: 'test-service',
        selector: 'test-service',
        version: '0.1.0',
        enabled: true,
        has_message_feature: false,
      },
    },
  ]),
};

describe('PhilipsHueService Poll', () => {
  let gladys;
  let initialApi;

  beforeEach(() => {
    gladys = {
      job: {
        wrapper: (type, func) => {
          return async () => {
            return func();
          };
        },
      },
      event: {
        emit: fake.resolves(null),
      },
      device: deviceManager,
      stateManager: {
        get: fake.resolves(true),
      },
    };
    initialApi = MockedPhilipsHueClient.v3.api;
  });

  afterEach(() => {
    // Reset API after each test to avoid bugs
    MockedPhilipsHueClient.v3.api = initialApi;
  });

  it('should poll light', async () => {
    const philipsHueService = PhilipsHueService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await philipsHueService.device.init();
    await philipsHueService.device.poll({
      external_id: 'light:1234:1',
      features: [
        {
          category: 'light',
          type: 'binary',
        },
      ],
    });
  });
  it('should return hue api not found', async () => {
    const philipsHueService = PhilipsHueService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await philipsHueService.device.init();
    try {
      await philipsHueService.device.poll({
        external_id: 'light:not-found:1',
        features: [
          {
            category: 'light',
            type: 'binary',
          },
        ],
      });
      expect.fail();
    } catch (e) {
      expect(e.message).eq('HUE_API_NOT_FOUND');
    }
  });
  it('should poll light and update binary', async () => {
    // PREPARE
    const philipsHueService = PhilipsHueService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await philipsHueService.device.init();
    // EXECUTE
    await philipsHueService.device.poll({
      external_id: 'light:1234:1',
      features: [
        {
          category: 'light',
          type: 'binary',
        },
      ],
    });
    // ASSERT
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'philips-hue-light:1234:1:binary',
      state: 0,
    });
  });
  it('should poll light and update color for color mode xy', async () => {
    // PREPARE
    const philipsHueService = PhilipsHueService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await philipsHueService.device.init();
    // EXECUTE
    await philipsHueService.device.poll({
      external_id: 'light:1234:1',
      features: [
        {
          category: 'light',
          type: 'color',
        },
      ],
    });
    // ASSERT
    // Color is xy: [0.3321, 0.3605], so 16187362 in Int
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'philips-hue-light:1234:1:color',
      state: 16187362,
    });
  });
  it('should poll light and update color for color mode hs', async () => {
    // PREPARE
    const philipsHueService = PhilipsHueService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    philipsHueService.device.hueClient.api = {
      createLocal: () => ({
        connect: () => hueApiHsColorMode,
      }),
    };
    await philipsHueService.device.init();
    // EXECUTE
    await philipsHueService.device.poll({
      external_id: 'light:1234:1',
      features: [
        {
          category: 'light',
          type: 'color',
        },
      ],
    });
    // ASSERT
    // Color is hsb: 67, so 16187362 in Int
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'philips-hue-light:1234:1:color',
      state: 11534095,
    });
  });
  it('should poll light with mode ct and update color temperature', async () => {
    // PREPARE
    const philipsHueService = PhilipsHueService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    philipsHueService.device.hueClient.api = {
      createLocal: () => ({
        connect: () => hueApiCtColorMode,
      }),
    };
    await philipsHueService.device.init();
    // EXECUTE
    await philipsHueService.device.poll({
      external_id: 'light:1234:1',
      features: [
        {
          category: 'light',
          type: 'color',
        },
        {
          category: 'light',
          type: 'temperature',
        },
      ],
    });
    // ASSERT
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'philips-hue-light:1234:1:color',
      state: 16759424,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'philips-hue-light:1234:1:temperature',
      state: 305,
    });
  });
  it('should poll light and update bri', async () => {
    // PREPARE
    const philipsHueService = PhilipsHueService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await philipsHueService.device.init();
    // EXECUTE
    await philipsHueService.device.poll({
      external_id: 'light:1234:1',
      features: [
        {
          category: 'light',
          type: 'brightness',
        },
      ],
    });
    // ASSERT
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'philips-hue-light:1234:1:brightness',
      state: 22,
    });
  });
});
