const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const get = require('get-value');

const { fake, assert } = sinon;

const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');
const { EVENTS } = require('../../../utils/constants');

const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

describe('gateway.forwardDeviceStateToAlexa', () => {
  const variable = {};
  const stateManager = {};
  const serviceManager = {};
  const event = {};

  const newEvent = {
    type: EVENTS.DEVICE.NEW_STATE,
    device_feature: 'my-device',
  };

  const alexaService = {
    alexaHandler: {
      onDiscovery: fake.returns({ onDiscovery: true }),
      onReportState: fake.returns({ onReportState: true }),
      onExecute: fake.returns({ onExecute: true }),
    },
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

    variable.setValue = fake.resolves(null);
    variable.destroy = fake.resolves(null);

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

    serviceManager.getService = fake.returns(alexaService);

    clock = sinon.useFakeTimers();

    gateway = new Gateway(variable, event, {}, {}, {}, {}, stateManager, serviceManager, job, scheduler);
    gateway.alexaForwardStateTimeout = 1;
    gateway.connected = true;
    gateway.alexaConnected = true;
    gateway.gladysGatewayClient.alexaReportState = fake.resolves(null);
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('should forward device state to alexa', async () => {
    stateManager.get = (key) => {
      const feature = {
        name: 'New device feature',
        selector: 'my-device',
        external_id: 'hue:binary:1',
        category: 'light',
        type: 'binary',
        read_only: false,
        has_feedback: false,
        last_value: 0,
        last_value_changed: null,
        last_value_string: null,
        last_daily_aggregate: null,
        last_hourly_aggregate: null,
        last_monthly_aggregate: null,
        min: 0,
        max: 1,
      };
      if (key === 'deviceFeature') {
        return feature;
      }

      // deviceById
      return {
        id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
        name: 'Light',
        selector: 'my-device',
        external_id: 'test-device-external',
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
        room_id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
        created_at: '2019-02-12 07:49:07.556 +00:00',
        updated_at: '2019-02-12 07:49:07.556 +00:00',
        features: [feature],
      };
    };

    await gateway.forwardDeviceStateToAlexa(newEvent);

    // Force wait
    clock.tick(200);

    const calledParam = gateway.gladysGatewayClient.alexaReportState.lastArg;
    assert.calledWith(gateway.gladysGatewayClient.alexaReportState, {
      event: {
        header: {
          namespace: 'Alexa',
          name: 'ChangeReport',
          messageId: get(calledParam, 'event.header.messageId'),
          payloadVersion: '3',
        },
        endpoint: { endpointId: 'my-device' },
        payload: {
          change: {
            cause: { type: 'PHYSICAL_INTERACTION' },
            properties: [
              {
                namespace: 'Alexa.PowerController',
                name: 'powerState',
                value: 'OFF',
                timeOfSample: get(calledParam, 'event.payload.change.properties.0.timeOfSample'),
                uncertaintyInMilliseconds: 0,
              },
            ],
          },
        },
      },
      context: {
        properties: [
          {
            namespace: 'Alexa.PowerController',
            name: 'powerState',
            value: 'OFF',
            timeOfSample: get(calledParam, 'context.properties.0.timeOfSample'),
            uncertaintyInMilliseconds: 0,
          },
        ],
      },
    });
  });

  it('should forward device brightness to alexa', async () => {
    stateManager.get = (key) => {
      const feature = {
        name: 'New device feature',
        selector: 'my-device',
        external_id: 'hue:binary:1',
        category: 'light',
        type: 'brightness',
        read_only: false,
        has_feedback: false,
        last_value: 100,
        last_value_changed: null,
        last_value_string: null,
        last_daily_aggregate: null,
        last_hourly_aggregate: null,
        last_monthly_aggregate: null,
        min: 0,
        max: 200,
      };
      if (key === 'deviceFeature') {
        return feature;
      }

      // deviceById
      return {
        id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
        name: 'Light',
        selector: 'my-device',
        external_id: 'test-device-external',
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
        room_id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
        created_at: '2019-02-12 07:49:07.556 +00:00',
        updated_at: '2019-02-12 07:49:07.556 +00:00',
        features: [feature],
      };
    };

    await gateway.forwardDeviceStateToAlexa(newEvent);

    // Force wait
    clock.tick(200);

    const calledParam = gateway.gladysGatewayClient.alexaReportState.lastArg;
    assert.calledWith(gateway.gladysGatewayClient.alexaReportState, {
      event: {
        header: {
          namespace: 'Alexa',
          name: 'ChangeReport',
          messageId: get(calledParam, 'event.header.messageId'),
          payloadVersion: '3',
        },
        endpoint: { endpointId: 'my-device' },
        payload: {
          change: {
            cause: { type: 'PHYSICAL_INTERACTION' },
            properties: [
              {
                namespace: 'Alexa.BrightnessController',
                name: 'brightness',
                value: 50,
                timeOfSample: get(calledParam, 'event.payload.change.properties.0.timeOfSample'),
                uncertaintyInMilliseconds: 0,
              },
            ],
          },
        },
      },
      context: {
        properties: [
          {
            namespace: 'Alexa.BrightnessController',
            name: 'brightness',
            value: 50,
            timeOfSample: get(calledParam, 'context.properties.0.timeOfSample'),
            uncertaintyInMilliseconds: 0,
          },
        ],
      },
    });
  });

  it('should forward only once', async () => {
    stateManager.get = (key) => {
      const feature = {
        name: 'New device feature',
        selector: 'my-device',
        external_id: 'hue:binary:1',
        category: 'light',
        type: 'binary',
        read_only: false,
        has_feedback: false,
        last_value: 0,
        last_value_changed: null,
        last_value_string: null,
        last_daily_aggregate: null,
        last_hourly_aggregate: null,
        last_monthly_aggregate: null,
        min: 0,
        max: 1,
      };
      if (key === 'deviceFeature') {
        return feature;
      }

      // deviceById
      return {
        id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
        name: 'Light',
        selector: 'my-device',
        external_id: 'test-device-external',
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
        room_id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
        created_at: '2019-02-12 07:49:07.556 +00:00',
        updated_at: '2019-02-12 07:49:07.556 +00:00',
        features: [feature],
      };
    };

    await gateway.forwardDeviceStateToAlexa(newEvent);
    await gateway.forwardDeviceStateToAlexa(newEvent);

    // Force wait
    clock.tick(200);

    assert.calledOnce(gateway.gladysGatewayClient.alexaReportState);
  });

  it('should not forward, unknown type of device', async () => {
    stateManager.get = (key) => {
      const feature = {
        name: 'New device feature',
        selector: 'my-device',
        external_id: 'hue:binary:1',
        category: 'siren',
        type: 'binary',
        read_only: true,
        has_feedback: false,
        last_value: 0,
        last_value_changed: null,
        last_value_string: null,
        last_daily_aggregate: null,
        last_hourly_aggregate: null,
        last_monthly_aggregate: null,
        min: 0,
        max: 1,
      };

      if (key === 'deviceFeature') {
        return feature;
      }
      // deviceById
      return {
        id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
        name: 'Light',
        selector: 'my-device',
        external_id: 'test-device-external',
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
        room_id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
        created_at: '2019-02-12 07:49:07.556 +00:00',
        updated_at: '2019-02-12 07:49:07.556 +00:00',
        features: [feature],
      };
    };

    await gateway.forwardDeviceStateToAlexa(newEvent);

    // Force wait
    clock.tick(200);

    assert.notCalled(gateway.gladysGatewayClient.alexaReportState);
  });

  it('should not forward, alexa not connected', async () => {
    stateManager.get = (key) => {
      const feature = {
        name: 'New device feature',
        selector: 'my-device',
        external_id: 'hue:binary:1',
        category: 'light',
        type: 'binary',
        read_only: true,
        has_feedback: false,
        last_value: 0,
        last_value_changed: null,
        last_value_string: null,
        last_daily_aggregate: null,
        last_hourly_aggregate: null,
        last_monthly_aggregate: null,
        min: 0,
        max: 1,
      };

      if (key === 'deviceFeature') {
        return feature;
      }
      // deviceById
      return {
        id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
        name: 'Light',
        selector: 'my-device',
        external_id: 'test-device-external',
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
        room_id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
        created_at: '2019-02-12 07:49:07.556 +00:00',
        updated_at: '2019-02-12 07:49:07.556 +00:00',
        features: [feature],
      };
    };

    // Force not connected
    gateway.alexaConnected = false;

    await gateway.forwardDeviceStateToAlexa(newEvent);

    // Force wait
    clock.tick(200);

    assert.notCalled(gateway.gladysGatewayClient.alexaReportState);
  });
  it('forward should fail silently', async () => {
    stateManager.get = (key) => {
      const feature = {
        name: 'New device feature',
        selector: 'my-device',
        external_id: 'hue:binary:1',
        category: 'light',
        type: 'binary',
        read_only: false,
        has_feedback: false,
        last_value: 0,
        last_value_changed: null,
        last_value_string: null,
        last_daily_aggregate: null,
        last_hourly_aggregate: null,
        last_monthly_aggregate: null,
        min: 0,
        max: 1,
      };
      if (key === 'deviceFeature') {
        return feature;
      }

      // deviceById
      return {
        id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
        name: 'Light',
        selector: 'my-device',
        external_id: 'test-device-external',
        service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
        room_id: '2398c689-8b47-43cc-ad32-e98d9be098b5',
        created_at: '2019-02-12 07:49:07.556 +00:00',
        updated_at: '2019-02-12 07:49:07.556 +00:00',
        features: [feature],
      };
    };

    // Force error
    gateway.gladysGatewayClient.alexaReportState = fake.rejects(null);

    await gateway.forwardDeviceStateToAlexa(newEvent);

    // Force wait
    clock.tick(200);

    const calledParam = gateway.gladysGatewayClient.alexaReportState.lastArg;
    assert.calledWith(gateway.gladysGatewayClient.alexaReportState, {
      event: {
        header: {
          namespace: 'Alexa',
          name: 'ChangeReport',
          messageId: get(calledParam, 'event.header.messageId'),
          payloadVersion: '3',
        },
        endpoint: { endpointId: 'my-device' },
        payload: {
          change: {
            cause: { type: 'PHYSICAL_INTERACTION' },
            properties: [
              {
                namespace: 'Alexa.PowerController',
                name: 'powerState',
                value: 'OFF',
                timeOfSample: get(calledParam, 'event.payload.change.properties.0.timeOfSample'),
                uncertaintyInMilliseconds: 0,
              },
            ],
          },
        },
      },
      context: {
        properties: [
          {
            namespace: 'Alexa.PowerController',
            name: 'powerState',
            value: 'OFF',
            timeOfSample: get(calledParam, 'context.properties.0.timeOfSample'),
            uncertaintyInMilliseconds: 0,
          },
        ],
      },
    });
  });
});
