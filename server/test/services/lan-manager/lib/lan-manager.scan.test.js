const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert, stub } = sinon;

const LANManager = require('../../../../services/lan-manager/lib');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

const gladys = {};
const serviceId = '2f3b1972-63ec-4a9b-b46c-d87611feba69';
const NmapScan = stub();

describe('LANManager scan', () => {
  let manager;

  beforeEach(() => {
    manager = new LANManager(gladys, serviceId, NmapScan);
    manager.configured = true;

    NmapScan.prototype.startScan = fake.returns([]);
    NmapScan.prototype.cancelScan = fake.returns([]);
    NmapScan.prototype.stopTimer = fake.returns([]);
    NmapScan.prototype.removeAllListeners = fake.returns([]);
    NmapScan.prototype.on = stub();

    gladys.event = {
      emit: fake.returns(true),
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('scan devices', async () => {
    manager.configured = true;
    manager.ipMasks = [
      { mask: '255.255.255.248/29', enabled: true },
      { mask: '192.168.0.1/10', enabled: false },
    ];

    NmapScan.prototype.on.onCall(1).yieldsRight([{ device: '1' }, { device: '2', mac: 'mac' }]);

    const result = await manager.scan();

    expect(manager.scanning).to.equal(false);
    expect(result).deep.equal([{ device: '2', mac: 'mac' }]);
    expect(manager.discoveredDevices).deep.equal([{ device: '2', mac: 'mac' }]);

    assert.calledWithNew(NmapScan);
    assert.calledTwice(gladys.event.emit);
    assert.calledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.LAN.SCANNING,
      payload: {
        scanning: true,
        configured: true,
      },
    });
    assert.calledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.LAN.SCANNING,
      payload: {
        scanning: false,
        configured: true,
        deviceChanged: true,
        success: true,
      },
    });
  });

  it('scan devices dupe found', async () => {
    manager.configured = true;
    manager.ipMasks = [
      { mask: '255.255.255.248/29', enabled: true },
      { mask: '192.168.0.1/10', enabled: false },
    ];

    NmapScan.prototype.on.onCall(1).yieldsRight([
      { device: '1', mac: 'mac' },
      { device: '2', mac: 'mac' },
    ]);

    const result = await manager.scan();

    expect(manager.scanning).to.equal(false);
    expect(result).deep.equal([
      { device: '1', mac: 'mac' },
      { device: '2', mac: 'mac' },
    ]);
    expect(manager.discoveredDevices).deep.equal([{ device: '2', mac: 'mac' }]);

    assert.calledWithNew(NmapScan);
    assert.calledTwice(gladys.event.emit);
    assert.calledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.LAN.SCANNING,
      payload: {
        scanning: true,
        configured: true,
      },
    });
    assert.calledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.LAN.SCANNING,
      payload: {
        scanning: false,
        configured: true,
        deviceChanged: true,
        success: true,
      },
    });
  });

  it('scan devices error', async () => {
    manager.configured = true;
    manager.ipMasks = [
      { mask: '255.255.255.248/29', enabled: true },
      { mask: '192.168.0.1/10', enabled: false },
    ];

    NmapScan.prototype.on.onCall(0).yieldsRight(new Error('this is an error'));

    const result = await manager.scan();

    expect(manager.scanning).to.equal(false);
    expect(result).deep.equal([]);

    assert.calledWithNew(NmapScan);
    assert.calledTwice(gladys.event.emit);
    assert.calledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.LAN.SCANNING,
      payload: {
        scanning: true,
        configured: true,
      },
    });
    assert.calledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.LAN.SCANNING,
      payload: {
        scanning: false,
        configured: true,
        deviceChanged: false,
        success: false,
      },
    });
  });

  it('scan devices cancel', async () => {
    manager.configured = true;
    manager.ipMasks = [
      { mask: '255.255.255.248/29', enabled: true },
      { mask: '192.168.0.1/10', enabled: false },
    ];

    NmapScan.prototype.on.onCall(0).yieldsRight('Scan cancelled');

    const result = await manager.scan();

    expect(manager.scanning).to.equal(false);
    expect(result).deep.equal([]);

    assert.calledWithNew(NmapScan);
    assert.calledTwice(gladys.event.emit);
    assert.calledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.LAN.SCANNING,
      payload: {
        scanning: true,
        configured: true,
      },
    });
    assert.calledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.LAN.SCANNING,
      payload: {
        scanning: false,
        configured: true,
        deviceChanged: false,
        success: true,
      },
    });
  });

  it('already scanning', async () => {
    manager.scanning = true;

    await manager.scan();

    expect(manager.scanning).to.equal(true);

    assert.notCalled(gladys.event.emit);
  });

  it('not configured', async () => {
    manager.configured = false;

    try {
      await manager.scan();
      assert.fail();
    } catch (e) {
      expect(e).instanceOf(ServiceNotConfiguredError);
    }

    assert.notCalled(gladys.event.emit);
  });
});
