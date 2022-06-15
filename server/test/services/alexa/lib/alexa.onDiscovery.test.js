const sinon = require('sinon');
const { expect } = require('chai');
const get = require('get-value');

const { assert, fake } = sinon;
const AlexaHandler = require('../../../../services/alexa/lib');

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
});
