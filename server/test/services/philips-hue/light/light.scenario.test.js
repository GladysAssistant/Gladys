const chai = require('chai');
const chaiAssert = require('chai').assert;
const sinon = require('sinon');
const EventEmitter = require('events');
const chaiAsPromised = require('chai-as-promised');
const proxyquire = require('proxyquire').noCallThru();
const { MockedPhilipsHueClient } = require('../mocks.test');

const { fake, stub } = sinon;

chai.use(chaiAsPromised);

const PhilipsHueService = proxyquire('../../../../services/philips-hue/index', {
  'node-hue-api': MockedPhilipsHueClient,
});

const StateManager = require('../../../../lib/state');
const { transformBrightnessValue } = require('../../../../services/philips-hue/lib/utils/transformBrightnessValue');

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

const philipsHueService = PhilipsHueService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');

describe('PhilipsHueService', () => {
  afterEach(() => {
    sinon.reset();
  });

  describe('> Failures', () => {
    it('should not find hue api', async () => {
      await philipsHueService.device.init();
      const promise = philipsHueService.device.scenario(
        {
          external_id: 'light:4567:1',
          features: [
            {
              category: 'light',
              type: 'fade-in',
            },
          ],
        },
        {
          category: 'light',
          type: 'fade-in',
        },
        1,
      );
      chaiAssert.isRejected(promise, 'HUE_API_NOT_FOUND');
    });

    it('should not find non existing feature', async () => {
      await philipsHueService.device.init();
      const promise = philipsHueService.device.scenario(
        {
          external_id: 'light:1234:1',
          features: [
            {
              category: 'light',
              type: 'fade-in',
            },
          ],
        },
        {
          category: 'light',
          type: 'fake-feature',
        },
        1,
      );
      chaiAssert.isRejected(promise, 'Philips Hue : Feature type = "fake-feature" not handled');
    });
  });

  describe('> Fade in', () => {
    beforeEach(() => {
      philipsHueService.device.setValue = fake.returns(null);
      stub(philipsHueService.device, 'poll').callsFake(() => {
        event.emit('device.new-state', {
          device_feature_external_id: 'philips-hue-light:1234:1:brightness',
          state: transformBrightnessValue(50),
        });
      });
    });

    afterEach(() => {
      philipsHueService.device.poll.restore();
    });

    it('should play fade-in scenario with light initial binary state off', async () => {
      await philipsHueService.device.init();
      await philipsHueService.device.scenario(
        {
          external_id: 'light:1234:1',
          features: [
            {
              category: 'light',
              type: 'fade-in',
            },
            {
              category: 'light',
              type: 'binary',
              last_value: 0,
            },
            {
              category: 'light',
              type: 'brightness',
            },
          ],
        },
        {
          category: 'light',
          type: 'fade-in',
        },
        {
          duration: 0,
          targetBrightness: 50,
        },
      );
    });

    it('should play fade-in scenario with light initial brightness more than target', async () => {
      await philipsHueService.device.init();
      await philipsHueService.device.scenario(
        {
          external_id: 'light:1234:1',
          features: [
            {
              category: 'light',
              type: 'fade-in',
            },
            {
              category: 'light',
              type: 'binary',
              last_value: 'on',
            },
            {
              category: 'light',
              type: 'brightness',
              last_value: 60,
            },
          ],
        },
        {
          category: 'light',
          type: 'fade-in',
        },
        {
          duration: 0,
          targetBrightness: 50,
        },
      );
    });
  });
});
