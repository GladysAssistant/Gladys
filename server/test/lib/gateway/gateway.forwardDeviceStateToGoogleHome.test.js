const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');

const BottleneckMock = function BottleneckMock() {
  return {
    wrap: (callback) => (arg0, arg1, arg2) => callback(arg0, arg1, arg2),
  };
};

const { EVENTS } = require('../../../utils/constants');

const forwardDeviceStateToGoogleHomeProxy = proxyquire('../../../lib/gateway/gateway.forwardDeviceStateToGoogleHome', {
  bottleneck: BottleneckMock,
});

const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
  './gateway.forwardDeviceStateToGoogleHome': forwardDeviceStateToGoogleHomeProxy,
});

describe('gateway.forwardDeviceStateToGoogleHome', () => {
  const variable = {};
  const stateManager = {};
  const event = {};

  const oneEvent = {
    type: EVENTS.DEVICE.NEW_STATE,
    device_feature: 'my-device',
  };

  let gateway;
  let clock;

  beforeEach(async () => {
    const job = {
      wrapper: (type, func) => {
        return async () => {
          return func();
        };
      },
      updateProgress: fake.resolves({}),
    };

    const scheduler = {
      scheduleJob: (rule, callback) => {
        return {
          callback,
          rule,
          cancel: () => {},
        };
      },
    };

    event.on = fake.returns(null);
    event.emit = fake.returns(null);

    stateManager.get = fake.returns({
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    });

    clock = sinon.useFakeTimers();

    gateway = new Gateway(variable, event, {}, {}, {}, {}, stateManager, {}, job, scheduler);
    gateway.googleHomeForwardStateTimeout = 1;
    gateway.connected = true;
    gateway.googleHomeConnected = true;
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('should forward an event to google home', async () => {
    stateManager.get = (type) => {
      const feature = {
        id: 'f2e2d5ea-bcea-4092-b597-7b8fb723e070',
        device_id: '31ad9f11-4ec7-495e-8238-2e576092ac0c',
        name: 'Lampe luminosité',
        selector: 'mqtt-brightness',
        external_id: 'mqtt:brightness',
        category: 'light',
        type: 'brightness',
        read_only: false,
        keep_history: true,
        has_feedback: false,
        unit: null,
        min: 0,
        max: 100,
        last_value: 97,
        last_value_string: null,
      };
      if (type === 'deviceById') {
        return {
          id: '31ad9f11-4ec7-495e-8238-2e576092ac0c',
          service_id: '54a4c447-0caa-4ed5-aa6f-5019e4b27754',
          room_id: '89abf7bc-208c-411a-a69b-33a173753e81',
          name: 'Lampe modified',
          selector: 'mqtt-lampe',
          model: null,
          external_id: 'mqtt:lampe',
          should_poll: false,
          poll_frequency: null,
          features: [feature],
          params: [],
        };
      }
      return feature;
    };

    await gateway.forwardDeviceStateToGoogleHome(oneEvent);

    // Force wait
    clock.tick(200);

    assert.calledWith(gateway.gladysGatewayClient.googleHomeReportState, {
      devices: { states: { 'mqtt-lampe': { brightness: 97, online: true } } },
    });
  });

  it('should not forward event to google home, event empty', async () => {
    stateManager.get = (type) => {
      const feature = {
        id: 'f2e2d5ea-bcea-4092-b597-7b8fb723e070',
        device_id: '31ad9f11-4ec7-495e-8238-2e576092ac0c',
        name: 'Camera',
        selector: 'mqtt-brightness',
        external_id: 'mqtt:brightness',
        category: 'camera',
        type: 'camera',
        read_only: false,
        keep_history: true,
        has_feedback: false,
        unit: null,
        min: 0,
        max: 100,
        last_value: 97,
        last_value_string: null,
      };
      if (type === 'deviceById') {
        return {
          id: '31ad9f11-4ec7-495e-8238-2e576092ac0c',
          service_id: '54a4c447-0caa-4ed5-aa6f-5019e4b27754',
          room_id: '89abf7bc-208c-411a-a69b-33a173753e81',
          name: 'Camera',
          selector: 'camera',
          model: null,
          external_id: 'camera',
          should_poll: false,
          poll_frequency: null,
          features: [feature],
          params: [],
        };
      }
      return feature;
    };

    await gateway.forwardDeviceStateToGoogleHome(oneEvent);

    // Force wait
    clock.tick(200);

    assert.notCalled(gateway.gladysGatewayClient.googleHomeReportState);
  });
});
