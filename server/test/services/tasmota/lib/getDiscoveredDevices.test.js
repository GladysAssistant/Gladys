const { expect } = require('chai');
const sinon = require('sinon');

const TasmotaHandler = require('../../../../services/tasmota/lib');

const existingDevice = {
  external_id: 'alreadyExists',
  name: 'alreadyExists',
  model: 'sonoff-basic',
  features: [
    {
      name: 'feature 1',
      type: 'type 1',
      category: 'category 1',
      external_id: 'external_id:1',
    },
    {
      name: 'feature 2',
      type: 'type 2',
      category: 'category 2',
      external_id: 'external_id:2',
    },
  ],
};

const gladys = {
  stateManager: {
    get: (key, externalId) => {
      if (externalId === 'alreadyExists') {
        return existingDevice;
      }
      return undefined;
    },
  },
};

describe('TasmotaHandler - getDiscoveredDevices', () => {
  const tasmotaHandler = new TasmotaHandler(gladys, 'service-uuid-random');
  sinon.spy(tasmotaHandler, 'handleMqttMessage');

  beforeEach(() => {
    sinon.reset();
    tasmotaHandler.mqttDevices = {};
  });

  it('nothing discovered', () => {
    const result = tasmotaHandler.getDiscoveredDevices();
    expect(result).to.be.lengthOf(0);
  });

  it('discovered already in Gladys', () => {
    tasmotaHandler.mqttDevices.alreadyExists = {
      external_id: 'alreadyExists',
      model: 'sonoff-basic',
    };
    const result = tasmotaHandler.getDiscoveredDevices();
    expect(result).to.be.lengthOf(1);
    expect(result).deep.eq([existingDevice]);
  });

  it('discovered already in Gladys, but updated (basic to pow)', () => {
    tasmotaHandler.mqttDevices.alreadyExists = {
      external_id: 'alreadyExists',
      model: 'sonoff-pow',
      features: [
        {
          name: 'feature 1',
          type: 'type 1',
          category: 'category 1',
          external_id: 'external_id:1',
        },
        {
          name: 'feature 2 bis',
          type: 'type 2',
          category: 'category 2',
          external_id: 'external_id:2',
        },
        {
          name: 'feature 3',
          type: 'type 3',
          category: 'category 3',
          external_id: 'external_id:3',
        },
      ],
    };
    const result = tasmotaHandler.getDiscoveredDevices();
    expect(result).to.be.lengthOf(1);

    const expectedDevice = {
      external_id: 'alreadyExists',
      model: 'sonoff-pow',
      name: 'alreadyExists',
      features: [
        {
          name: 'feature 1',
          type: 'type 1',
          category: 'category 1',
          external_id: 'external_id:1',
        },
        {
          name: 'feature 2',
          type: 'type 2',
          category: 'category 2',
          external_id: 'external_id:2',
        },
        {
          name: 'feature 3',
          type: 'type 3',
          category: 'category 3',
          external_id: 'external_id:3',
        },
      ],
    };
    expectedDevice.updatable = true;
    expectedDevice.name = 'alreadyExists';
    expect(result).deep.eq([expectedDevice]);
  });

  it('discovered not already in Gladys', () => {
    tasmotaHandler.mqttDevices.notAlreadyExists = {
      external_id: 'notAlreadyExists',
    };
    const result = tasmotaHandler.getDiscoveredDevices();
    expect(result).to.be.lengthOf(1);
    expect(result).deep.eq([tasmotaHandler.mqttDevices.notAlreadyExists]);
  });
});
