const { expect } = require('chai');
const sinon = require('sinon');

const SonoffHandler = require('../../../../services/sonoff/lib');

const existingDevice = {
  external_id: 'alreadyExists',
  name: 'alreadyExists',
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
    };
    const result = sonoffHandler.getDiscoveredDevices();
    expect(result).to.be.lengthOf(1);
    expect(result).deep.eq([existingDevice]);
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
