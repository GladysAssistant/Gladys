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

    it('should tell a device that leaves before its interview ended', () => {
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_joined', data: { friendly_name: 'a', ieee_address: IEEE } });
      zigbee2MqttManager.handleBridgeEvent({
        type: 'device_interview',
        data: { ieee_address: '0x99', status: 'started' },
      });
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_leave', data: { ieee_address: IEEE } });
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_leave', data: { ieee_address: '0x99' } });
      expect(lastSent().map((entry) => entry.status)).to.deep.equal(['left', 'left']);
      expect(lastSent()[0]).to.include({ friendly_name: 'a', updated_at: NOW });
      // Joining again, it starts over
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_joined', data: { ieee_address: IEEE } });
      expect(lastSent()[0]).to.include({ status: 'joined', friendly_name: 'a' });
    });

    it('should forget a device that leaves once its interview ended', () => {
      zigbee2MqttManager.handleBridgeEvent({
        type: 'device_interview',
        data: { ieee_address: IEEE, status: 'failed' },
      });
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

    it('should keep the ready devices not in Gladys when asked, in their order', () => {
      zigbee2MqttManager.getDiscoveredDevices = fake.returns([
        { name: 'in gladys', id: 'device-id', ieee_address: '0x01' },
        { name: 'to add', ieee_address: '0x03' },
      ]);
      const ready = { status: 'successful', supported: true, definition };
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_interview', data: { ieee_address: '0x04', ...ready } });
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_interview', data: { ieee_address: '0x01', ...ready } });
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_joined', data: { ieee_address: '0x02' } });
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_interview', data: { ieee_address: '0x03', ...ready } });
      zigbee2MqttManager.handleBridgeEvent({
        type: 'device_interview',
        data: { ieee_address: '0x05', status: 'failed' },
      });
      zigbee2MqttManager.clearPairingDevices(true);
      // Not discovered yet (0x04) is not in Gladys either
      expect(Object.keys(zigbee2MqttManager.pairingDevices)).to.deep.equal(['0x04', '0x03']);
      expect(lastSent().map((entry) => entry.ieee_address)).to.deep.equal(['0x04', '0x03']);
      expect(lastSent()[1].device).to.deep.equal({ name: 'to add', ieee_address: '0x03' });
    });

    it('should tell nothing when every device is kept', () => {
      zigbee2MqttManager.handleBridgeEvent({
        type: 'device_interview',
        data: { ieee_address: '0x42', status: 'successful', supported: true, definition },
      });
      gladys.event.emit = fake();
      zigbee2MqttManager.clearPairingDevices(true);
      expect(zigbee2MqttManager.pairingDevices).to.have.property('0x42');
      assert.notCalled(gladys.event.emit);
    });
  });

  describe('updatePairingFromList', () => {
    it('should follow a rename in Zigbee2mqtt, and leave telling it to the caller', () => {
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_joined', data: { ieee_address: IEEE } });
      gladys.event.emit = fake();
      const changed = zigbee2MqttManager.updatePairingFromList([
        { ieee_address: IEEE, friendly_name: 'kitchen bulb' },
        { ieee_address: '0x99', friendly_name: 'other' },
        { ieee_address: '0x98' },
      ]);
      expect(changed).to.equal(true);
      expect(zigbee2MqttManager.pairingDevices[IEEE].friendly_name).to.equal('kitchen bulb');
      assert.notCalled(gladys.event.emit);
    });

    it('should tell that no name changed', () => {
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_joined', data: { friendly_name: 'a', ieee_address: IEEE } });
      const changed = zigbee2MqttManager.updatePairingFromList([{ ieee_address: IEEE, friendly_name: 'a' }]);
      expect(changed).to.equal(false);
    });

    it('should forget a device no longer listed, removed from Zigbee2mqtt', () => {
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_joined', data: { friendly_name: 'a', ieee_address: IEEE } });
      zigbee2MqttManager.handleBridgeEvent({
        type: 'device_joined',
        data: { friendly_name: 'b', ieee_address: '0x99' },
      });
      gladys.event.emit = fake();
      const changed = zigbee2MqttManager.updatePairingFromList([{ ieee_address: '0x99', friendly_name: 'b' }]);
      expect(changed).to.equal(true);
      expect(Object.keys(zigbee2MqttManager.pairingDevices)).to.deep.equal(['0x99']);
      assert.notCalled(gladys.event.emit);
    });

    it('should keep a device told gone, which is no longer listed', () => {
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_joined', data: { ieee_address: IEEE } });
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_leave', data: { ieee_address: IEEE } });
      const changed = zigbee2MqttManager.updatePairingFromList([]);
      expect(changed).to.equal(false);
      expect(zigbee2MqttManager.pairingDevices[IEEE].status).to.equal('left');
    });

    it('should take the end of an interview whose event was missed', () => {
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_joined', data: { friendly_name: 'a', ieee_address: IEEE } });
      zigbee2MqttManager.handleBridgeEvent({
        type: 'device_joined',
        data: { friendly_name: 'b', ieee_address: '0x99' },
      });
      zigbee2MqttManager.handleBridgeEvent({
        type: 'device_interview',
        data: { friendly_name: 'c', ieee_address: '0x98', status: 'started' },
      });
      sinon.clock.tick(1000);
      const changed = zigbee2MqttManager.updatePairingFromList([
        { ieee_address: IEEE, friendly_name: 'a', interview_completed: true, supported: true, definition },
        {
          ieee_address: '0x99',
          friendly_name: 'b',
          interview_completed: true,
          supported: false,
          definition: { model: 'X1' },
        },
        { ieee_address: '0x98', friendly_name: 'c', interview_completed: true, supported: false, definition: null },
      ]);
      expect(changed).to.equal(true);
      expect(zigbee2MqttManager.pairingDevices[IEEE]).to.deep.equal({
        ieee_address: IEEE,
        friendly_name: 'a',
        status: 'ready',
        model: 'LED1545G12',
        vendor: 'IKEA',
        description: 'TRADFRI bulb E27',
        updated_at: '2026-11-20T10:00:01.000Z',
      });
      expect(zigbee2MqttManager.pairingDevices['0x99']).to.include({
        status: 'unsupported',
        model: 'X1',
        vendor: null,
      });
      expect(zigbee2MqttManager.pairingDevices['0x98']).to.include({ status: 'unsupported', model: null });
    });

    it('should leave an interview not finished, and an outcome already told', () => {
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_joined', data: { friendly_name: 'a', ieee_address: IEEE } });
      zigbee2MqttManager.handleBridgeEvent({
        type: 'device_interview',
        data: { friendly_name: 'b', ieee_address: '0x99', status: 'started' },
      });
      zigbee2MqttManager.handleBridgeEvent({
        type: 'device_interview',
        data: { friendly_name: 'c', ieee_address: '0x98', status: 'failed' },
      });
      const changed = zigbee2MqttManager.updatePairingFromList([
        { ieee_address: IEEE, friendly_name: 'a', interview_completed: false, supported: false, definition: null },
        // Interviewed again: the list still tells the former interview
        { ieee_address: '0x99', friendly_name: 'b', interview_completed: true, interviewing: true, definition },
        { ieee_address: '0x98', friendly_name: 'c', interview_completed: true, supported: true, definition },
      ]);
      expect(changed).to.equal(false);
      expect(zigbee2MqttManager.pairingDevices[IEEE].status).to.equal('joined');
      expect(zigbee2MqttManager.pairingDevices['0x99'].status).to.equal('interviewing');
      expect(zigbee2MqttManager.pairingDevices['0x98'].status).to.equal('failed');
    });
  });

  describe('emitPairingDevicesAfterList', () => {
    it('should tell the registry when an entry changed', () => {
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_joined', data: { friendly_name: 'a', ieee_address: IEEE } });
      gladys.event.emit = fake();
      zigbee2MqttManager.emitPairingDevicesAfterList(true);
      assert.calledOnce(gladys.event.emit);
    });

    it('should tell the ready devices again only when their Gladys device changed', () => {
      zigbee2MqttManager.getDiscoveredDevices = fake.returns([]);
      zigbee2MqttManager.handleBridgeEvent({
        type: 'device_interview',
        data: { friendly_name: 'kitchen bulb', ieee_address: IEEE, status: 'successful', supported: true, definition },
      });
      expect(lastSent()[0].device).to.equal(null);
      gladys.event.emit = fake();
      // The same list again: nothing to tell
      zigbee2MqttManager.emitPairingDevicesAfterList(false);
      assert.notCalled(gladys.event.emit);
      // Only now known
      zigbee2MqttManager.getDiscoveredDevices = fake.returns([{ name: 'kitchen bulb', ieee_address: IEEE }]);
      zigbee2MqttManager.emitPairingDevicesAfterList(false);
      assert.calledOnce(gladys.event.emit);
      zigbee2MqttManager.emitPairingDevicesAfterList(false);
      assert.calledOnce(gladys.event.emit);
      // Added to Gladys since
      zigbee2MqttManager.getDiscoveredDevices = fake.returns([{ id: 'a1', name: 'kitchen bulb', ieee_address: IEEE }]);
      zigbee2MqttManager.emitPairingDevicesAfterList(false);
      assert.calledTwice(gladys.event.emit);
      expect(lastSent()[0].device.id).to.equal('a1');
    });

    it('should tell nothing when no name changed and no device is ready', () => {
      zigbee2MqttManager.handleBridgeEvent({ type: 'device_joined', data: { friendly_name: 'a', ieee_address: IEEE } });
      gladys.event.emit = fake();
      zigbee2MqttManager.emitPairingDevicesAfterList(false);
      assert.notCalled(gladys.event.emit);
    });
  });
});
