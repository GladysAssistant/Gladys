const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const Zigbee2MqttService = require('../../../../services/zigbee2mqtt/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';
const NOW = new Date('2026-11-20T10:00:00.000Z').getTime();

describe('zigbee2mqtt updatePermitJoin', () => {
  let zigbee2MqttManager;
  let gladys;

  beforeEach(() => {
    sinon.useFakeTimers(NOW);
    gladys = {
      job: {
        wrapper: (type, func) => func,
      },
      event: {
        emit: fake(),
      },
    };
    zigbee2MqttManager = new Zigbee2MqttService(gladys, {}, serviceId);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should keep and tell joining allowed with its end', () => {
    zigbee2MqttManager.updatePermitJoin(true, NOW + 254000);
    expect(zigbee2MqttManager.z2mPermitJoin).to.equal(true);
    expect(zigbee2MqttManager.z2mPermitJoinEnd).to.equal(NOW + 254000);
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
      payload: { allowed: true, remainingSeconds: 254 },
    });
  });

  it('should keep joining allowed without an end when Zigbee2mqtt does not tell it', () => {
    zigbee2MqttManager.updatePermitJoin(true, undefined);
    expect(zigbee2MqttManager.z2mPermitJoinEnd).to.equal(null);
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
      payload: { allowed: true, remainingSeconds: null },
    });
  });

  it('should forget the end when joining closes', () => {
    zigbee2MqttManager.z2mPermitJoin = true;
    zigbee2MqttManager.z2mPermitJoinEnd = NOW + 10000;
    zigbee2MqttManager.updatePermitJoin(false, NOW + 10000);
    expect(zigbee2MqttManager.z2mPermitJoin).to.equal(false);
    expect(zigbee2MqttManager.z2mPermitJoinEnd).to.equal(null);
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
      payload: { allowed: false, remainingSeconds: null },
    });
  });

  it('should tell nothing when nothing changes', () => {
    zigbee2MqttManager.updatePermitJoin(false);
    zigbee2MqttManager.z2mPermitJoin = true;
    zigbee2MqttManager.z2mPermitJoinEnd = NOW + 10000;
    zigbee2MqttManager.updatePermitJoin(true, NOW + 10000);
    assert.notCalled(gladys.event.emit);
  });

  it('should tell a new end of joining already allowed, keeping the devices seen joining', () => {
    zigbee2MqttManager.z2mPermitJoin = true;
    zigbee2MqttManager.z2mPermitJoinEnd = NOW + 10000;
    zigbee2MqttManager.pairingDevices = { '0x01': { ieee_address: '0x01', status: 'ready' } };
    zigbee2MqttManager.updatePermitJoin(true, NOW + 254000);
    expect(zigbee2MqttManager.pairingDevices).to.have.property('0x01');
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
      payload: { allowed: true, remainingSeconds: 254 },
    });
  });

  it('should forget the devices seen joining when joining opens again', () => {
    zigbee2MqttManager.pairingDevices = { '0x01': { ieee_address: '0x01', status: 'failed' } };
    zigbee2MqttManager.updatePermitJoin(true, NOW + 254000);
    expect(zigbee2MqttManager.pairingDevices).to.deep.equal({});
    assert.calledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PAIRING,
      payload: [],
    });
  });

  it('should keep the ready devices not in Gladys when joining opens again', () => {
    zigbee2MqttManager.getDiscoveredDevices = fake.returns([{ name: 'to add', ieee_address: '0x01' }]);
    zigbee2MqttManager.pairingDevices = {
      '0x01': { ieee_address: '0x01', status: 'ready' },
      '0x02': { ieee_address: '0x02', status: 'left' },
    };
    zigbee2MqttManager.updatePermitJoin(true, NOW + 254000);
    expect(Object.keys(zigbee2MqttManager.pairingDevices)).to.deep.equal(['0x01']);
  });

  it('should keep the devices seen joining when the window Gladys forgot is told again (reconnection, init)', () => {
    zigbee2MqttManager.updatePermitJoin(true, NOW + 254000);
    zigbee2MqttManager.pairingDevices = { '0x01': { ieee_address: '0x01', status: 'ready' } };
    // Gladys forgets joining (an init), then the retained info of the same window comes again
    zigbee2MqttManager.updatePermitJoin(false, null, { forgotten: true });
    expect(zigbee2MqttManager.z2mPermitJoin).to.equal(false);
    zigbee2MqttManager.updatePermitJoin(true, NOW + 254000);
    expect(zigbee2MqttManager.z2mPermitJoin).to.equal(true);
    expect(zigbee2MqttManager.pairingDevices).to.have.property('0x01');
    // Closed by Zigbee2mqtt, then another window: the device added to Gladys meanwhile is forgotten
    zigbee2MqttManager.getDiscoveredDevices = fake.returns([{ id: 'device-id', ieee_address: '0x01' }]);
    zigbee2MqttManager.updatePermitJoin(false);
    zigbee2MqttManager.updatePermitJoin(true, NOW + 254000);
    expect(zigbee2MqttManager.pairingDevices).to.deep.equal({});
  });

  it('should take the exact end told before the estimate of the response for the window told again after an init', () => {
    // bridge/info first, then the response 300 ms later
    zigbee2MqttManager.updatePermitJoin(true, NOW + 253600);
    zigbee2MqttManager.updatePermitJoin(true, NOW + 254000, { estimated: true });
    expect(zigbee2MqttManager.z2mPermitJoinEnd).to.equal(NOW + 253600);
    zigbee2MqttManager.pairingDevices = { '0x01': { ieee_address: '0x01', status: 'ready' } };
    zigbee2MqttManager.updatePermitJoin(false, null, { forgotten: true });
    zigbee2MqttManager.updatePermitJoin(true, NOW + 253600);
    expect(zigbee2MqttManager.pairingDevices).to.have.property('0x01');
  });

  it('should take the estimate of the response until bridge/info tells the exact end', () => {
    zigbee2MqttManager.updatePermitJoin(true, NOW + 254000, { estimated: true });
    zigbee2MqttManager.updatePermitJoin(true, NOW + 253600);
    expect(zigbee2MqttManager.z2mPermitJoinEnd).to.equal(NOW + 253600);
  });

  it('should keep the window and its end when told again without an end after an init (Zigbee2mqtt 1)', () => {
    zigbee2MqttManager.updatePermitJoin(true, NOW + 254000, { estimated: true });
    zigbee2MqttManager.pairingDevices = { '0x01': { ieee_address: '0x01', status: 'ready' } };
    zigbee2MqttManager.updatePermitJoin(false, null, { forgotten: true });
    zigbee2MqttManager.updatePermitJoin(true, undefined);
    expect(zigbee2MqttManager.z2mPermitJoinEnd).to.equal(NOW + 254000);
    expect(zigbee2MqttManager.pairingDevices).to.have.property('0x01');
  });

  it('should keep the window not told closed, without its end once passed, when told again without an end', () => {
    zigbee2MqttManager.updatePermitJoin(true, NOW + 1000);
    zigbee2MqttManager.updatePermitJoin(false, null, { forgotten: true });
    zigbee2MqttManager.pairingDevices = { '0x01': { ieee_address: '0x01', status: 'ready' } };
    sinon.clock.tick(5000);
    zigbee2MqttManager.updatePermitJoin(true, undefined);
    expect(zigbee2MqttManager.z2mPermitJoinEnd).to.equal(null);
    expect(zigbee2MqttManager.pairingDevices).to.have.property('0x01');
  });

  it('should keep the devices seen joining when the window of another clock is told again after an init', () => {
    // An external Zigbee2mqtt 30 s behind: its info, then the estimate of the response, too far to be the same end
    zigbee2MqttManager.updatePermitJoin(true, NOW + 224000);
    zigbee2MqttManager.updatePermitJoin(true, NOW + 254000, { estimated: true });
    zigbee2MqttManager.pairingDevices = { '0x01': { ieee_address: '0x01', status: 'ready' } };
    zigbee2MqttManager.updatePermitJoin(false, null, { forgotten: true });
    zigbee2MqttManager.updatePermitJoin(true, NOW + 224000);
    expect(zigbee2MqttManager.z2mPermitJoin).to.equal(true);
    expect(zigbee2MqttManager.pairingDevices).to.have.property('0x01');
  });

  it('should keep the devices seen joining when a window without any end is told again after an init (Zigbee2mqtt 1)', () => {
    zigbee2MqttManager.updatePermitJoin(true, undefined);
    zigbee2MqttManager.pairingDevices = { '0x01': { ieee_address: '0x01', status: 'unsupported' } };
    zigbee2MqttManager.updatePermitJoin(false, null, { forgotten: true });
    zigbee2MqttManager.updatePermitJoin(true, undefined);
    expect(zigbee2MqttManager.pairingDevices).to.have.property('0x01');
    // Told closed after the init (the window ended meanwhile): the next one is new
    zigbee2MqttManager.updatePermitJoin(false, null, { forgotten: true });
    zigbee2MqttManager.updatePermitJoin(false);
    zigbee2MqttManager.updatePermitJoin(true, undefined);
    expect(zigbee2MqttManager.pairingDevices).to.deep.equal({});
  });

  it('should tell the answer of a request even when it changes nothing', () => {
    zigbee2MqttManager.updatePermitJoin(true, NOW + 254000, { estimated: true });
    zigbee2MqttManager.pairingDevices = { '0x01': { ieee_address: '0x01', status: 'ready' } };
    gladys.event.emit = fake();
    // Extend within 5 s of the known end (Zigbee2mqtt 1, or another clock: no bridge/info end follows)
    sinon.clock.tick(2000);
    zigbee2MqttManager.updatePermitJoin(true, NOW + 256000, { estimated: true, answered: true });
    expect(zigbee2MqttManager.z2mPermitJoinEnd).to.equal(NOW + 254000);
    expect(zigbee2MqttManager.pairingDevices).to.have.property('0x01');
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
      payload: { allowed: true, remainingSeconds: 252 },
    });
    // A stop while joining is already closed
    zigbee2MqttManager.updatePermitJoin(false);
    gladys.event.emit = fake();
    zigbee2MqttManager.updatePermitJoin(false, undefined, { answered: true });
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
      payload: { allowed: false, remainingSeconds: null },
    });
  });

  it('should keep the end of the open window when Zigbee2mqtt tells none (Zigbee2mqtt 1)', () => {
    zigbee2MqttManager.updatePermitJoin(true, NOW + 254000);
    gladys.event.emit = fake();
    zigbee2MqttManager.updatePermitJoin(true, undefined);
    expect(zigbee2MqttManager.z2mPermitJoinEnd).to.equal(NOW + 254000);
    assert.notCalled(gladys.event.emit);
  });

  it('should not take an end from another clock (external Zigbee2mqtt), past or too far', () => {
    zigbee2MqttManager.updatePermitJoin(true, NOW - 300000);
    expect(zigbee2MqttManager.z2mPermitJoinEnd).to.equal(null);
    zigbee2MqttManager.updatePermitJoin(true, NOW + 254000);
    zigbee2MqttManager.updatePermitJoin(true, NOW + 600000);
    expect(zigbee2MqttManager.z2mPermitJoinEnd).to.equal(NOW + 254000);
  });
});
