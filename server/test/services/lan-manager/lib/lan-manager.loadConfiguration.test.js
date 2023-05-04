const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { VARIABLES, PRESENCE_STATUS, TIMERS } = require('../../../../services/lan-manager/lib/lan-manager.constants');

const { fake, stub, assert } = sinon;

const mockOS = {
  networkInterfaces: () => {
    return {
      eth0: [
        {
          cidr: '192.168.1.17/24',
          family: 'IPv4',
          internal: false,
        },
        {
          cidr: 'fd26:b3e4:7fd5:401e::/64',
          family: 'IPv6',
          internal: false,
        },
      ],
      wlan0: [
        {
          cidr: '195.168.1.17/24',
          family: 'IPv4',
          internal: false,
        },
      ],
      lo: [
        {
          cidr: '127.0.0.17/24',
          family: 'IPv4',
          internal: true,
        },
      ],
      docker0: [
        {
          cidr: '172.17.0.1/10',
          family: 'IPv4',
          internal: false,
        },
      ],
    };
  },
};
const proxyLoadConfiguration = proxyquire('../../../../services/lan-manager/lib/lan-manager.loadConfiguration', {
  os: mockOS,
});
const LANManager = proxyquire('../../../../services/lan-manager/lib', {
  './lan-manager.loadConfiguration': proxyLoadConfiguration,
});

const gladys = {};
const serviceId = '2f3b1972-63ec-4a9b-b46c-d87611feba69';
const ScanClass = stub();

describe('LANManager loadConfiguration', () => {
  let manager;

  beforeEach(() => {
    manager = new LANManager(gladys, serviceId, ScanClass);
    ScanClass.prototype.startScan = fake.returns(null);
    ScanClass.prototype.on = fake.returns(null);

    gladys.variable = {
      setValue: fake.resolves('value'),
      getValue: fake.resolves('value'),
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('no config in db', async () => {
    gladys.variable = {
      getValue: fake.resolves(null),
    };

    await manager.loadConfiguration();

    assert.callCount(gladys.variable.getValue, 3);
    assert.calledWithExactly(gladys.variable.getValue, VARIABLES.PRESENCE_STATUS, serviceId);
    assert.calledWithExactly(gladys.variable.getValue, VARIABLES.PRESENCE_FREQUENCY, serviceId);
    assert.calledWithExactly(gladys.variable.getValue, VARIABLES.IP_MASKS, serviceId);

    expect(manager.presenceScanner).deep.eq({ status: PRESENCE_STATUS.ENABLED, frequency: TIMERS.PRESENCE });
    expect(manager.ipMasks).deep.eq([
      {
        mask: '192.168.1.17/24',
        name: 'eth0',
        networkInterface: true,
        enabled: true,
      },
      {
        mask: '195.168.1.17/24',
        name: 'wlan0',
        networkInterface: true,
        enabled: true,
      },
      {
        mask: '172.17.0.1/10',
        name: 'docker0',
        networkInterface: true,
        enabled: false,
      },
    ]);
  });

  it('all config in db', async () => {
    const storedMasks = [
      {
        mask: '195.168.1.17/24',
        name: 'anotherName',
        enabled: false,
      },
      {
        mask: '200.168.1.17/24',
        name: 'custom name',
        enabled: true,
      },
    ];

    gladys.variable = {
      getValue: stub()
        .onCall(0)
        .resolves(PRESENCE_STATUS.DISABLED)
        .onCall(1)
        .resolves(60000)
        .onCall(2)
        .resolves(JSON.stringify(storedMasks))
        .resolves(null),
    };

    await manager.loadConfiguration();

    assert.callCount(gladys.variable.getValue, 3);
    assert.calledWithExactly(gladys.variable.getValue, VARIABLES.PRESENCE_STATUS, serviceId);
    assert.calledWithExactly(gladys.variable.getValue, VARIABLES.PRESENCE_FREQUENCY, serviceId);
    assert.calledWithExactly(gladys.variable.getValue, VARIABLES.IP_MASKS, serviceId);

    expect(manager.presenceScanner).deep.eq({ status: PRESENCE_STATUS.DISABLED, frequency: 60000 });
    expect(manager.ipMasks).deep.eq([
      {
        mask: '195.168.1.17/24',
        name: 'wlan0',
        networkInterface: true,
        enabled: false,
      },
      {
        mask: '200.168.1.17/24',
        name: 'custom name',
        networkInterface: false,
        enabled: true,
      },
      {
        mask: '192.168.1.17/24',
        name: 'eth0',
        networkInterface: true,
        enabled: true,
      },
      {
        mask: '172.17.0.1/10',
        name: 'docker0',
        networkInterface: true,
        enabled: false,
      },
    ]);
  });
});
