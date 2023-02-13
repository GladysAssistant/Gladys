const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const LANManager = require('../../../../services/lan-manager/lib');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const gladys = {};
const serviceId = '2f3b1972-63ec-4a9b-b46c-d87611feba69';
const lanDiscovery = {};

describe('LANManager scan', () => {
  let manager;

  beforeEach(() => {
    manager = new LANManager(gladys, serviceId, lanDiscovery);

    gladys.event = {
      emit: fake.returns(true),
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('scan devices', async () => {
    const discoveredDevices = [{ name: 'device1' }, { name: 'device2' }];
    lanDiscovery.discover = fake.resolves(discoveredDevices);
    manager.ipMasks = [
      { mask: '255.255.255.248/29', enabled: true },
      { mask: '192.168.0.1/10', enabled: false },
    ];

    const scan = manager.scan();

    expect(manager.scanning).to.equal(true);

    const result = await scan;
    expect(manager.discoveredDevices).to.deep.equal(discoveredDevices);
    expect(result).to.deep.equal(discoveredDevices);
    expect(manager.scanning).to.equal(false);

    assert.calledOnceWithExactly(lanDiscovery.discover, [
      '255.255.255.249',
      '255.255.255.250',
      '255.255.255.251',
      '255.255.255.252',
      '255.255.255.253',
      '255.255.255.254',
    ]);
    assert.calledTwice(gladys.event.emit);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.LAN.SCANNING,
      payload: {
        scanning: true,
      },
    });
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.LAN.SCANNING,
      payload: {
        scanning: false,
      },
    });
  });

  it('nothing to scan', async () => {
    manager.ipMasks = [{ mask: '192.168.0.1/10', enabled: false }];

    const scan = manager.scan();

    const result = await scan;
    expect(manager.discoveredDevices).to.deep.equal([]);
    expect(result).to.deep.equal([]);
    expect(manager.scanning).to.equal(false);

    assert.notCalled(lanDiscovery.discover);
    assert.calledTwice(gladys.event.emit);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.LAN.SCANNING,
      payload: {
        scanning: true,
      },
    });
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.LAN.SCANNING,
      payload: {
        scanning: false,
      },
    });
  });

  it('fail to scan devices', async () => {
    lanDiscovery.discover = fake.rejects(new Error('ERROR'));
    manager.ipMasks = [{ mask: '255.255.255.248/29', enabled: true }];

    const scan = manager.scan();

    expect(manager.scanning).to.equal(true);

    const result = await scan;
    expect(manager.discoveredDevices).to.deep.equal([]);
    expect(result).to.deep.equal([]);
    expect(manager.scanning).to.equal(false);

    assert.calledOnceWithExactly(lanDiscovery.discover, [
      '255.255.255.249',
      '255.255.255.250',
      '255.255.255.251',
      '255.255.255.252',
      '255.255.255.253',
      '255.255.255.254',
    ]);
    assert.calledTwice(gladys.event.emit);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.LAN.SCANNING,
      payload: {
        scanning: true,
      },
    });
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.LAN.SCANNING,
      payload: {
        scanning: false,
      },
    });
  });
});
