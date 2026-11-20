const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const Zigbee2MqttService = require('../../../../services/zigbee2mqtt/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';
const NOW = '2026-11-20T10:00:00.000Z';
const IEEE = '0x00158d0001';

const definition = { model: 'LED1545G12', vendor: 'IKEA', description: 'TRADFRI bulb E27' };

describe('zigbee2mqtt pairingDevices', () => {
  let zigbee2MqttManager;
  let gladys;

  const lastSent = () => {
    const calls = gladys.event.emit
      .getCalls()
      .filter((call) => call.args[1].type === WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PAIRING);
    return calls.length ? calls[calls.length - 1].args[1].payload : undefined;
  };

  beforeEach(() => {
    sinon.useFakeTimers(new Date(NOW));
    gladys = {
      job: {
        wrapper: (type, func) => func,
      },
      event: {
        emit: fake(),
      },
    };
    zigbee2MqttManager = new Zigbee2MqttService(gladys, {}, serviceId);
    zigbee2MqttManager.getDiscoveredDevices = fake.returns([
      { name: 'kitchen bulb', ieee_address: IEEE, external_id: 'zigbee2mqtt:kitchen bulb' },
      { name: 'other', ieee_address: '0x99', external_id: 'zigbee2mqtt:other' },
    ]);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('handleBridgeEvent', () => {
    it('should follow a device that joins', () => {
      zigbee2MqttManager.handleBridgeEvent({
        type: 'device_joined',
        data: { friendly_name: IEEE, ieee_address: IEEE },
      });
      expect(lastSent()).to.deep.equal([
        {
          ieee_address: IEEE,
          friendly_name: IEEE,
          status: 'joined',
          model: null,
          vendor: null,
          description: null,
          updated_at: NOW,
          device: null,
        },
      ]);
      assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL);
    });

    it('should follow a device through its interview until it is ready', () => {
      zigbee2MqttManager.handleBridgeEvent({
        type: 'device_joined',
        data: { friendly_name: IEEE, ieee_address: IEEE },
      });
      zigbee2MqttManager.handleBridgeEvent({
        type: 'device_interview',
        data: { friendly_name: IEEE, ieee_address: IEEE, status: 'started' },
      });
      expect(lastSent()[0].status).to.equal('interviewing');
      zigbee2MqttManager.handleBridgeEvent({
        type: 'device_interview',
        data: { friendly_name: 'kitchen bulb', ieee_address: IEEE, status: 'successful', supported: true, definition },
      });
      const [entry] = lastSent();
      expect(entry).to.include({
        status: 'ready',
        friendly_name: 'kitchen bulb',
        model: 'LED1545G12',
        vendor: 'IKEA',
        description: 'TRADFRI bulb E27',
      });
      expect(entry.device).to.deep.equal({
        name: 'kitchen bulb',
        ieee_address: IEEE,
        external_id: 'zigbee2mqtt:kitchen bulb',
      });
    });

    it('should create the entry from the first event it gets', () => {
      zigbee2MqttManager.handleBridgeEvent({
        type: 'device_interview',
        data: { ieee_address: IEEE, status: 'started' },
      });
      expect(lastSent()[0]).to.include({ status: 'interviewing', friendly_name: IEEE });
    });

    it('should tell a device Zigbee2mqtt does not support, with its model', () => {
      zigbee2MqttManager.handleBridgeEvent({
        type: 'device_interview',
        data: {
          friendly_name: IEEE,
          ieee_address: IEEE,
          status: 'successful',
          supported: false,
          definition: { model: 'lumi.unknown' },
        },
      });
      expect(lastSent()[0]).to.include({ status: 'unsupported', model: 'lumi.unknown', vendor: null, device: null });
    });

    it('should tell a device without definition as not supported', () => {
      zigbee2MqttManager.handleBridgeEvent({
        type: 'device_interview',
        data: { friendly_name: IEEE, ieee_address: IEEE, status: 'successful', supported: true },
      });
      expect(lastSent()[0]).to.include({ status: 'unsupported', model: null });
    });

    it('should tell a failed interview, even after a ready one, keeping what the device is', () => {
      zigbee2MqttManager.handleBridgeEvent({
        type: 'device_interview',
        data: { friendly_name: IEEE, ieee_address: IEEE, status: 'successful', supported: true, definition },
      });
      zigbee2MqttManager.handleBridgeEvent({
        type: 'device_interview',
        data: { friendly_name: IEEE, ieee_address: IEEE, status: 'failed' },
      });
      expect(lastSent()[0]).to.include({ status: 'failed', model: 'LED1545G12', device: null });
    });

    it('should start over for a device that joins again', () => {
      zigbee2MqttManager.handleBridgeEvent({
        type: 'device_interview',
        data: { friendly_name: 'kitchen bulb', ieee_address: IEEE, status: 'failed' },
      });
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_joined', data: { ieee_address: IEEE } });
      expect(lastSent()).to.have.lengthOf(1);
      expect(lastSent()[0]).to.include({ status: 'joined', friendly_name: 'kitchen bulb' });
    });

    it('should forget a device that leaves', () => {
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_joined', data: { ieee_address: IEEE } });
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_leave', data: { ieee_address: IEEE } });
      expect(lastSent()).to.deep.equal([]);
      expect(zigbee2MqttManager.pairingDevices).to.deep.equal({});
    });

    it('should tell nothing when a device it does not follow leaves', () => {
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_leave', data: { ieee_address: IEEE } });
      assert.notCalled(gladys.event.emit);
    });

    it('should ignore the announce of a known device, an unknown event, and an event without address', () => {
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_announce', data: { ieee_address: IEEE } });
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_interview', data: { ieee_address: IEEE, status: 'other' } });
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_joined', data: {} });
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_joined' });
      zigbee2MqttManager.handleBridgeEvent(null);
      assert.notCalled(gladys.event.emit);
      expect(zigbee2MqttManager.pairingDevices).to.deep.equal({});
    });
  });

  describe('getPairingDevices', () => {
    it('should give the devices in the order they appeared, reading Gladys devices only for ready ones', () => {
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_joined', data: { ieee_address: '0x02' } });
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_joined', data: { ieee_address: '0x01' } });
      const entries = zigbee2MqttManager.getPairingDevices('meter-feature-id');
      expect(entries.map((entry) => entry.ieee_address)).to.deep.equal(['0x02', '0x01']);
      assert.notCalled(zigbee2MqttManager.getDiscoveredDevices);
    });

    it('should give a ready device not discovered yet without its Gladys device', () => {
      zigbee2MqttManager.handleBridgeEvent({
        type: 'device_interview',
        data: { ieee_address: '0x42', status: 'successful', supported: true, definition },
      });
      const [entry] = zigbee2MqttManager.getPairingDevices('meter-feature-id');
      expect(entry.device).to.equal(null);
      assert.calledWithExactly(zigbee2MqttManager.getDiscoveredDevices, {}, 'meter-feature-id');
    });
  });

  describe('clearPairingDevices', () => {
    it('should forget the devices and tell it', () => {
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_joined', data: { ieee_address: IEEE } });
      zigbee2MqttManager.clearPairingDevices();
      expect(zigbee2MqttManager.pairingDevices).to.deep.equal({});
      expect(lastSent()).to.deep.equal([]);
    });

    it('should tell nothing when no device was followed', () => {
      zigbee2MqttManager.clearPairingDevices();
      assert.notCalled(gladys.event.emit);
    });
  });

  describe('updatePairingNames', () => {
    it('should follow a rename in Zigbee2mqtt', () => {
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_joined', data: { ieee_address: IEEE } });
      gladys.event.emit = fake();
      zigbee2MqttManager.updatePairingNames([
        { ieee_address: IEEE, friendly_name: 'kitchen bulb' },
        { ieee_address: '0x99', friendly_name: 'other' },
        { ieee_address: '0x98' },
      ]);
      expect(lastSent()[0].friendly_name).to.equal('kitchen bulb');
    });

    it('should tell the ready devices again, their Gladys device may only now be known', () => {
      zigbee2MqttManager.handleBridgeEvent({
        type: 'device_interview',
        data: { friendly_name: 'kitchen bulb', ieee_address: IEEE, status: 'successful', supported: true, definition },
      });
      gladys.event.emit = fake();
      zigbee2MqttManager.updatePairingNames([{ ieee_address: IEEE, friendly_name: 'kitchen bulb' }]);
      assert.calledOnce(gladys.event.emit);
    });

    it('should tell nothing when no name changed and no device is ready', () => {
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_joined', data: { friendly_name: 'a', ieee_address: IEEE } });
      gladys.event.emit = fake();
      zigbee2MqttManager.updatePairingNames([{ ieee_address: IEEE, friendly_name: 'a' }]);
      assert.notCalled(gladys.event.emit);
    });
  });
});
