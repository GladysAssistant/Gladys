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
});
