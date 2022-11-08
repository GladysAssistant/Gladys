const { fake, assert } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const EventEmitter = require('events');
const Promise = require('bluebird');
const get = require('get-value');

const GladysGatewayClientMock = require('./GladysGatewayClientMock.test');
const { EVENTS } = require('../../../utils/constants');

const event = new EventEmitter();

const Gateway = proxyquire('../../../lib/gateway', {
  '@gladysassistant/gladys-gateway-js': GladysGatewayClientMock,
});

const getConfig = require('../../../utils/getConfig');

const sequelize = {
  close: fake.resolves(null),
};

const system = {
  getInfos: fake.resolves({
    nodejs_version: 'v10.15.2',
    gladys_version: 'v4.0.0',
    is_docker: false,
  }),
  isDocker: fake.resolves(true),
  saveLatestGladysVersion: fake.returns(null),
  shutdown: fake.resolves(true),
};

const config = getConfig();

const job = {
  wrapper: (type, func) => {
    return async () => {
      return func();
    };
  },
  updateProgress: fake.resolves({}),
};

describe('gateway.forwardDeviceStateToAlexa', () => {
  const variable = {
    getValue: fake.resolves(null),
    setValue: fake.resolves(null),
  };
  const alexaService = {
    alexaHandler: {
      onDiscovery: fake.returns({ onDiscovery: true }),
      onReportState: fake.returns({ onReportState: true }),
      onExecute: fake.returns({ onExecute: true }),
    },
  };
  it('should forward device state to alexa', async () => {
    const serviceManager = {
      getService: fake.returns(alexaService),
    };
    const stateManager = {
      get: (key) => {
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
      },
    };
    const gateway = new Gateway(variable, event, system, sequelize, config, {}, stateManager, serviceManager, job);
    gateway.alexaForwardStateTimeout = 1;
    gateway.connected = true;
    gateway.alexaConnected = true;
    gateway.gladysGatewayClient.alexaReportState = fake.resolves(null);
    const newEvent = {
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'my-device',
    };
    await gateway.forwardDeviceStateToAlexa(newEvent);
    await Promise.delay(100);
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
    const serviceManager = {
      getService: fake.returns(alexaService),
    };
    const stateManager = {
      get: (key) => {
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
      },
    };
    const gateway = new Gateway(variable, event, system, sequelize, config, {}, stateManager, serviceManager, job);
    gateway.alexaForwardStateTimeout = 1;
    gateway.connected = true;
    gateway.alexaConnected = true;
    gateway.gladysGatewayClient.alexaReportState = fake.resolves(null);
    const newEvent = {
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'my-device',
    };
    await gateway.forwardDeviceStateToAlexa(newEvent);
    await Promise.delay(100);
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
    const serviceManager = {
      getService: fake.returns(alexaService),
    };
    const stateManager = {
      get: (key) => {
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
      },
    };
    const gateway = new Gateway(variable, event, system, sequelize, config, {}, stateManager, serviceManager, job);
    gateway.alexaForwardStateTimeout = 30;
    gateway.connected = true;
    gateway.alexaConnected = true;
    gateway.gladysGatewayClient.alexaReportState = fake.resolves(null);
    const newEvent = {
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'my-device',
    };
    await gateway.forwardDeviceStateToAlexa(newEvent);
    await gateway.forwardDeviceStateToAlexa(newEvent);
    await Promise.delay(100);
    assert.calledOnce(gateway.gladysGatewayClient.alexaReportState);
  });
  it('should not forward, unknown type of device', async () => {
    const serviceManager = {
      getService: fake.returns(alexaService),
    };
    const stateManager = {
      get: (key) => {
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
      },
    };
    const gateway = new Gateway(variable, event, system, sequelize, config, {}, stateManager, serviceManager, job);
    gateway.alexaForwardStateTimeout = 1;
    gateway.connected = true;
    gateway.alexaConnected = true;
    gateway.gladysGatewayClient.alexaReportState = fake.resolves(null);
    const newEvent = {
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'my-device',
    };
    await gateway.forwardDeviceStateToAlexa(newEvent);
    await Promise.delay(100);
    assert.notCalled(gateway.gladysGatewayClient.alexaReportState);
  });
  it('should not forward, alexa not connected', async () => {
    const serviceManager = {
      getService: fake.returns(alexaService),
    };
    const stateManager = {
      get: (key) => {
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
      },
    };
    const gateway = new Gateway(variable, event, system, sequelize, config, {}, stateManager, serviceManager, job);
    gateway.alexaForwardStateTimeout = 1;
    gateway.connected = true;
    gateway.alexaConnected = false;
    gateway.gladysGatewayClient.alexaReportState = fake.resolves(null);
    const newEvent = {
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'my-device',
    };
    await gateway.forwardDeviceStateToAlexa(newEvent);
    await Promise.delay(100);
    assert.notCalled(gateway.gladysGatewayClient.alexaReportState);
  });
  it('forward should fail silently', async () => {
    const serviceManager = {
      getService: fake.returns(alexaService),
    };
    const stateManager = {
      get: (key) => {
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
      },
    };
    const gateway = new Gateway(variable, event, system, sequelize, config, {}, stateManager, serviceManager, job);
    gateway.alexaForwardStateTimeout = 1;
    gateway.connected = true;
    gateway.alexaConnected = true;
    gateway.gladysGatewayClient.alexaReportState = fake.rejects(null);
    const newEvent = {
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'my-device',
    };
    await gateway.forwardDeviceStateToAlexa(newEvent);
    await Promise.delay(100);
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
