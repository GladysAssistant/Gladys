const { expect } = require('chai');
const sinon = require('sinon');

const NukiHandler = require('../../../../services/nuki/lib');

const { serviceId, existingDevice } = require('../mocks/consts.test');

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

describe('Nuki - MQTT - getDiscoveredDevices', () => {
  let nukiHandler;
  let protocolHandler;
  const protocol = 'mqtt';

  beforeEach(() => {
    nukiHandler = new NukiHandler(gladys, serviceId);
    protocolHandler = nukiHandler.protocols[protocol];
    sinon.spy(protocolHandler, 'handleMessage');
  });

  afterEach(() => {
    sinon.reset();
  });

  it('nothing discovered', () => {
    const result = nukiHandler.getDiscoveredDevices(protocol);
    expect(result).to.be.lengthOf(0);
  });

  it('discovered already in Gladys', () => {
    protocolHandler.discoveredDevices.alreadyExists = existingDevice;
    const result = nukiHandler.getDiscoveredDevices(protocol);
    expect(result).to.be.lengthOf(1);
    expect(result).deep.eq([{ ...existingDevice, updatable: false }]);
  });

  it('discovered already in Gladys, but updated (basic to pow)', () => {
    protocolHandler.discoveredDevices.alreadyExists = {
      external_id: 'alreadyExists',
      model: 'Smart Lock 3.0 Pro',
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
          min: 10,
        },
        {
          name: 'feature 3',
          type: 'type 3',
          category: 'category 3',
          external_id: 'external_id:3',
        },
      ],
    };
    const result = nukiHandler.getDiscoveredDevices(protocol);
    expect(result).to.be.lengthOf(1);

    const expectedDevice = {
      external_id: 'alreadyExists',
      model: 'Smart Lock 3.0 Pro',
      name: 'alreadyExists',
      room_id: 'room_id',
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
          min: 10,
        },
        {
          name: 'feature 3',
          type: 'type 3',
          category: 'category 3',
          external_id: 'external_id:3',
        },
      ],
      updatable: true,
      params: [],
    };

    expect(result).deep.eq([expectedDevice]);
  });

  it('discovered not already in Gladys', () => {
    protocolHandler.discoveredDevices.notAlreadyExists = {
      external_id: 'notAlreadyExists',
    };
    const result = nukiHandler.getDiscoveredDevices(protocol);
    expect(result).to.be.lengthOf(1);
    expect(result).deep.eq([protocolHandler.discoveredDevices.notAlreadyExists]);
  });
});
