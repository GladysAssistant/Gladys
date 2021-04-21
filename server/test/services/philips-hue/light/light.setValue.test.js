const { expect } = require('chai');
const sinon = require('sinon');
const EventEmitter = require('events');
const proxyquire = require('proxyquire').noCallThru();
const { MockedPhilipsHueClient, fakes } = require('../mocks.test');

const { fake, assert } = sinon;

const PhilipsHueService = proxyquire('../../../../services/philips-hue/index', {
  'node-hue-api': MockedPhilipsHueClient,
});

const StateManager = require('../../../../lib/state');

const event = new EventEmitter();
const stateManager = new StateManager(event);
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

const gladys = {
  device: deviceManager,
  stateManager,
  event,
};

describe('PhilipsHueService', () => {
  afterEach(() => {
    sinon.reset();
  });

  it('should set binary value (on)', async () => {
    const philipsHueService = PhilipsHueService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await philipsHueService.device.init();
    await philipsHueService.device.setValue(
      {
        external_id: 'light:1234:1',
        features: [
          {
            category: 'light',
            type: 'binary',
          },
        ],
      },
      {
        category: 'light',
        type: 'binary',
      },
      1,
    );

    assert.calledOnce(fakes.on);
    assert.notCalled(fakes.off);
    assert.notCalled(fakes.rgb);
  });
  it('should set binary value (off)', async () => {
    const philipsHueService = PhilipsHueService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await philipsHueService.device.init();
    await philipsHueService.device.setValue(
      {
        external_id: 'light:1234:1',
        features: [
          {
            category: 'light',
            type: 'binary',
          },
        ],
      },
      {
        category: 'light',
        type: 'binary',
      },
      0,
    );

    assert.calledOnce(fakes.off);
    assert.notCalled(fakes.on);
    assert.notCalled(fakes.rgb);
  });
  it('should set color value', async () => {
    const philipsHueService = PhilipsHueService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await philipsHueService.device.init();
    await philipsHueService.device.setValue(
      {
        external_id: 'light:1234:1',
        features: [
          {
            category: 'light',
            type: 'color',
          },
        ],
      },
      {
        category: 'light',
        type: 'color',
      },
      255,
    );

    assert.calledOnce(fakes.rgb);
    assert.notCalled(fakes.off);
    assert.notCalled(fakes.on);
  });
  it('should set brightness value', async () => {
    const philipsHueService = PhilipsHueService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await philipsHueService.device.init();
    await philipsHueService.device.setValue(
      {
        external_id: 'light:1234:1',
        features: [
          {
            category: 'light',
            type: 'brightness',
          },
        ],
      },
      {
        category: 'light',
        type: 'brightness',
      },
      80,
    );

    assert.calledOnce(fakes.brightness);
    assert.notCalled(fakes.off);
    assert.notCalled(fakes.on);
  });
  it('should return hue api not found', async () => {
    const philipsHueService = PhilipsHueService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await philipsHueService.device.init();

    try {
      await philipsHueService.device.setValue(
        {
          external_id: 'light:not-found:1',
          features: [
            {
              category: 'light',
              type: 'binary',
            },
          ],
        },
        {
          category: 'light',
          type: 'binary',
        },
        1,
      );
      expect.fail();
    } catch (e) {
      expect(e.message).eq('HUE_API_NOT_FOUND');
    }
  });
});
