const { expect } = require('chai');
const sinon = require('sinon');

const SonoffHandler = require('../../../../services/sonoff/lib');

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

describe('SonoffHandler - getDiscoveredDevices', () => {
  const sonoffHandler = new SonoffHandler(gladys, 'service-uuid-random');
  sinon.spy(sonoffHandler, 'handleMqttMessage');

  beforeEach(() => {
    sinon.reset();
    sonoffHandler.mqttDevices = {};
  });

  it('nothing discovered', () => {
    const result = sonoffHandler.getDiscoveredDevices();
    expect(result).to.be.lengthOf(0);
  });

  it('discovered already in Gladys', () => {
    sonoffHandler.mqttDevices.alreadyExists = {
      external_id: 'alreadyExists',
      model: 'sonoff-basic',
    };
    const result = sonoffHandler.getDiscoveredDevices();
    expect(result).to.be.lengthOf(1);
    expect(result).deep.eq([existingDevice]);
  });

  it('discovered already in Gladys, but updated (basic to pow)', () => {
    sonoffHandler.mqttDevices.alreadyExists = {
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
    const result = sonoffHandler.getDiscoveredDevices();
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
    sonoffHandler.mqttDevices.notAlreadyExists = {
      external_id: 'notAlreadyExists',
    };
    const result = sonoffHandler.getDiscoveredDevices();
    expect(result).to.be.lengthOf(1);
    expect(result).deep.eq([sonoffHandler.mqttDevices.notAlreadyExists]);
  });
});
