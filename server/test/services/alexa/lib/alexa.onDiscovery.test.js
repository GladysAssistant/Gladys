const sinon = require('sinon');
const { expect } = require('chai');
const get = require('get-value');

const { assert, fake } = sinon;
const AlexaHandler = require('../../../../services/alexa/lib');
const { mappings } = require('../../../../services/alexa/lib/deviceMappings');

const gladys = {
  stateManager: {
    state: {
      device: {},
    },
  },
};
const serviceId = 'd1e45425-fe25-4968-ac0f-bc695d5202d9';

describe('alexa.onDiscovery', () => {
  beforeEach(() => {
    sinon.reset();
    gladys.stateManager.state.device = {};
  });

  it('return one light with on/off, brightness & color capability', async () => {
    gladys.stateManager.state.device = {
      device_1: {
        get: fake.returns({
          name: 'Device 1',
          selector: 'device-1',
          external_id: 'device-1-external-id',
          features: [
            {
              read_only: false,
              category: 'light',
              type: 'binary',
            },
            {
              read_only: false,
              category: 'light',
              type: 'brightness',
            },
            {
              read_only: false,
              category: 'light',
              type: 'color',
            },
          ],
          model: 'device-model',
          room: {
            name: 'living-room',
          },
        }),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const result = alexaHandler.onDiscovery();
    const expectedResult = {
      event: {
        header: {
          namespace: 'Alexa.Discovery',
          name: 'Discover.Response',
          payloadVersion: '3',
          messageId: get(result, 'event.header.messageId'),
        },
        payload: {
          endpoints: [
            {
              endpointId: 'device-1',
              friendlyName: 'Device 1',
              manufacturerName: 'Gladys Assistant',
              description: 'Device 1',
              additionalAttributes: {},
              displayCategories: ['LIGHT'],
              capabilities: [
                {
                  type: 'AlexaInterface',
                  interface: 'Alexa.PowerController',
                  version: '3',
                  properties: { supported: [{ name: 'powerState' }], proactivelyReported: true, retrievable: true },
                },
                {
                  type: 'AlexaInterface',
                  interface: 'Alexa.BrightnessController',
                  version: '3',
                  properties: {
                    supported: [
                      {
                        name: 'brightness',
                      },
                    ],
                    proactivelyReported: true,
                    retrievable: true,
                  },
                },
                {
                  type: 'AlexaInterface',
                  interface: 'Alexa.ColorController',
                  version: '3',
                  properties: {
                    supported: [
                      {
                        name: 'color',
                      },
                    ],
                    proactivelyReported: true,
                    retrievable: true,
                  },
                },
                { type: 'AlexaInterface', interface: 'Alexa', version: '3' },
              ],
            },
          ],
        },
      },
    };
    expect(result).to.deep.eq(expectedResult);
    assert.calledOnce(gladys.stateManager.state.device.device_1.get);
  });
  it('return not return read_only devices', async () => {
    gladys.stateManager.state.device = {
      device_1: {
        get: fake.returns({
          name: 'Device 1',
          selector: 'device-1',
          external_id: 'device-1-external-id',
          features: [
            {
              read_only: true,
              category: 'light',
              type: 'binary',
            },
          ],
          model: 'device-model',
          room: {
            name: 'living-room',
          },
        }),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const result = alexaHandler.onDiscovery();
    const expectedResult = {
      event: {
        header: {
          namespace: 'Alexa.Discovery',
          name: 'Discover.Response',
          payloadVersion: '3',
          messageId: get(result, 'event.header.messageId'),
        },
        payload: {
          endpoints: [],
        },
      },
    };
    expect(result).to.deep.eq(expectedResult);
  });

  it('return one shutter with position capability when state and position are available', async () => {
    gladys.stateManager.state.device = {
      device_shutter: {
        get: fake.returns({
          name: 'Living Room Shutter',
          selector: 'device-shutter',
          external_id: 'device-shutter-external-id',
          features: [
            {
              read_only: false,
              category: 'shutter',
              type: 'state',
            },
            {
              read_only: false,
              category: 'shutter',
              type: 'position',
            },
          ],
          model: 'device-model',
          room: {
            name: 'living-room',
          },
        }),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const result = alexaHandler.onDiscovery();

    expect(result.event.payload.endpoints).to.deep.equal([
      {
        endpointId: 'device-shutter',
        friendlyName: 'Living Room Shutter',
        manufacturerName: 'Gladys Assistant',
        description: 'Living Room Shutter',
        additionalAttributes: {},
        displayCategories: ['INTERIOR_BLIND'],
        capabilities: [
          mappings.shutter.capabilities.position,
          { type: 'AlexaInterface', interface: 'Alexa', version: '3' },
        ],
      },
    ]);
  });

  it('return one shutter with mode capability when only state is available', async () => {
    gladys.stateManager.state.device = {
      device_shutter: {
        get: fake.returns({
          name: 'Living Room Shutter',
          selector: 'device-shutter',
          external_id: 'device-shutter-external-id',
          features: [
            {
              read_only: false,
              category: 'shutter',
              type: 'state',
            },
          ],
          model: 'device-model',
          room: {
            name: 'living-room',
          },
        }),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const result = alexaHandler.onDiscovery();

    expect(result.event.payload.endpoints).to.deep.equal([
      {
        endpointId: 'device-shutter',
        friendlyName: 'Living Room Shutter',
        manufacturerName: 'Gladys Assistant',
        description: 'Living Room Shutter',
        additionalAttributes: {},
        displayCategories: ['INTERIOR_BLIND'],
        capabilities: [
          mappings.shutter.capabilities.state,
          { type: 'AlexaInterface', interface: 'Alexa', version: '3' },
        ],
      },
    ]);
  });

  it('should ignore unmapped writable features', async () => {
    gladys.stateManager.state.device = {
      device_sensor: {
        get: fake.returns({
          name: 'Temperature sensor',
          selector: 'device-sensor',
          external_id: 'device-sensor-external-id',
          features: [
            {
              read_only: false,
              category: 'temperature-sensor',
              type: 'decimal',
            },
          ],
        }),
      },
    };

    const alexaHandler = new AlexaHandler(gladys, serviceId);
    const result = alexaHandler.onDiscovery();

    expect(result.event.payload.endpoints).to.deep.equal([]);
  });
});
