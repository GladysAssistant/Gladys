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
  params: [],
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
const serviceId = 'service-uuid-random';

describe('Tasmota - MQTT - getDiscoveredDevices', () => {
  let tasmotaHandler;
  let protocolHandler;
  const protocol = 'mqtt';

  beforeEach(() => {
    tasmotaHandler = new TasmotaHandler(gladys, serviceId);
    protocolHandler = tasmotaHandler.protocols[protocol];
    sinon.spy(protocolHandler, 'handleMessage');
  });

  afterEach(() => {
    sinon.reset();
  });

  it('nothing discovered', () => {
    const result = tasmotaHandler.getDiscoveredDevices(protocol);
    expect(result).to.be.lengthOf(0);
  });

  it('discovered already in Gladys', () => {
    protocolHandler.discoveredDevices.alreadyExists = {
      external_id: 'alreadyExists',
      model: 'sonoff-basic',
    };
    const result = tasmotaHandler.getDiscoveredDevices(protocol);
    expect(result).to.be.lengthOf(1);
    expect(result).deep.eq([existingDevice]);
  });

  it('discovered already in Gladys, but updated (basic to pow)', () => {
    protocolHandler.discoveredDevices.alreadyExists = {
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
    const result = tasmotaHandler.getDiscoveredDevices(protocol);
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
      params: [],
    };
    expectedDevice.updatable = true;
    expectedDevice.name = 'alreadyExists';
    expect(result).deep.eq([expectedDevice]);
  });

  it('discovered not already in Gladys', () => {
    protocolHandler.discoveredDevices.notAlreadyExists = {
      external_id: 'notAlreadyExists',
    };
    const result = tasmotaHandler.getDiscoveredDevices(protocol);
    expect(result).to.be.lengthOf(1);
    expect(result).deep.eq([protocolHandler.discoveredDevices.notAlreadyExists]);
  });
});

describe('Tasmota - HTTP - getDiscoveredDevices', () => {
  let tasmotaHandler;
  let protocolHandler;
  const protocol = 'http';

  beforeEach(() => {
    tasmotaHandler = new TasmotaHandler(gladys, serviceId);
    protocolHandler = tasmotaHandler.protocols[protocol];
    sinon.reset();
  });

  it('nothing discovered', () => {
    const result = tasmotaHandler.getDiscoveredDevices(protocol);
    expect(result).to.be.lengthOf(0);
  });

  it('discovered already in Gladys', () => {
    protocolHandler.discoveredDevices.alreadyExists = {
      external_id: 'alreadyExists',
      model: 'sonoff-basic',
    };
    const result = tasmotaHandler.getDiscoveredDevices(protocol);
    expect(result).to.be.lengthOf(1);
    expect(result).deep.eq([existingDevice]);
  });

  it('discovered already in Gladys, but updated (basic to pow)', () => {
    protocolHandler.discoveredDevices.alreadyExists = {
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
    const result = tasmotaHandler.getDiscoveredDevices(protocol);
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
      params: [],
    };
    expectedDevice.updatable = true;
    expectedDevice.name = 'alreadyExists';
    expect(result).deep.eq([expectedDevice]);
  });

  it('discovered already in Gladys, but updated (on params)', () => {
    protocolHandler.discoveredDevices.alreadyExists = {
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
      params: [
        {
          name: 'interface',
          value: 'http',
        },
      ],
    };
    const result = tasmotaHandler.getDiscoveredDevices(protocol);
    expect(result).to.be.lengthOf(1);

    const expectedDevice = {
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
      params: [
        {
          name: 'interface',
          value: 'http',
        },
      ],
    };
    expectedDevice.updatable = true;
    expectedDevice.name = 'alreadyExists';
    expect(result).deep.eq([expectedDevice]);
  });

  it('discovered not already in Gladys', () => {
    protocolHandler.discoveredDevices.notAlreadyExists = {
      external_id: 'notAlreadyExists',
    };
    const result = tasmotaHandler.getDiscoveredDevices(protocol);
    expect(result).to.be.lengthOf(1);
    expect(result).deep.eq([protocolHandler.discoveredDevices.notAlreadyExists]);
  });
});
