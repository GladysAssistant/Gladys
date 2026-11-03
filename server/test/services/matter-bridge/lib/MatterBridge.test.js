const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { EVENTS } = require('../../../../utils/constants');
const { BadParameters } = require('../../../../utils/coreErrors');
const { VARIABLES } = require('../../../../services/matter-bridge/lib/constants');
const { createMatter, feature } = require('../fakes');

const fse = { ensureDir: sinon.stub().resolves(), remove: sinon.stub().resolves() };
const MatterBridge = proxyquire('../../../../services/matter-bridge/lib/MatterBridge', { 'fs-extra': fse });

const SERVICE_ID = 'a810b8db-6d04-4697-bed3-c4b72c996279';

describe('MatterBridge', () => {
  let gladys;
  let variables;
  let devices;
  let matter;
  let bridge;

  const light = {
    id: 'light-id',
    name: 'Light',
    selector: 'light',
    features: [feature('light-binary', 'light', 'binary')],
  };
  const sensor = {
    id: 'sensor-id',
    name: 'Sensor',
    selector: 'sensor',
    features: [feature('sensor-t', 'temperature-sensor', 'decimal'), feature('sensor-h', 'humidity-sensor', 'decimal')],
  };
  const unsupported = { id: 'u-id', name: 'U', selector: 'u', features: [feature('u-f', 'unknown', 'decimal')] };

  beforeEach(() => {
    variables = { [VARIABLES.ENABLED]: 'true' };
    devices = [light, sensor, unsupported];
    gladys = {
      config: { storage: '/var/lib/gladysassistant/gladys.db' },
      system: { gladysVersion: 'v4.70.1' },
      variable: {
        getValue: sinon.stub().callsFake(async (name) => (name in variables ? variables[name] : null)),
        setValue: sinon.stub().callsFake(async (name, value) => {
          variables[name] = value;
        }),
        destroy: sinon.stub().callsFake(async (name) => {
          delete variables[name];
        }),
      },
      device: { get: sinon.stub().callsFake(async () => devices) },
      stateManager: { get: sinon.stub().returns({ last_value: 1 }) },
      event: { on: sinon.stub(), removeListener: sinon.stub(), emit: sinon.stub() },
    };
    matter = createMatter();
    bridge = new MatterBridge(gladys, SERVICE_ID, matter);
  });

  afterEach(() => {
    sinon.resetHistory();
    fse.remove.resetBehavior();
    fse.remove.resolves();
  });

  describe('start', () => {
    it('should not start when disabled', async () => {
      variables[VARIABLES.ENABLED] = 'false';
      await bridge.start();
      expect(bridge.server).to.equal(null);
      sinon.assert.notCalled(fse.ensureDir);
    });

    it('should start the node with the exposed devices', async () => {
      await bridge.start();
      expect(matter.server.started).to.equal(true);
      expect(matter.vars.get('storage.path')).to.equal('/var/lib/gladysassistant/matter-bridge');
      const { options } = matter.server;
      expect(options.network).to.deep.equal({ port: 5541 });
      expect(options.commissioning.passcode).to.be.a('number');
      expect(options.basicInformation).to.include({ softwareVersion: 47001, softwareVersionString: '4.70.1' });
      expect(options.basicInformation.uniqueId).to.not.equal(options.basicInformation.serialNumber);
      const [aggregator] = matter.server.added;
      expect(aggregator.id).to.equal('aggregator');
      expect(aggregator.children.map((c) => c.id)).to.deep.equal(['light', 'sensor']);
      expect(aggregator.children[1].children.map((c) => c.id)).to.deep.equal([
        'sensor-temperature-1',
        'sensor-humidity-2',
      ]);
      expect(bridge.devices.size).to.equal(2);
      sinon.assert.calledWith(gladys.event.on, EVENTS.TRIGGERS.CHECK, bridge.onTriggerCheck);
      sinon.assert.calledWith(gladys.event.on, EVENTS.DEVICE.CREATE, bridge.onDeviceChange);
      sinon.assert.calledWith(gladys.event.on, EVENTS.DEVICE.UPDATE, bridge.onDeviceChange);
      sinon.assert.calledWith(gladys.event.on, EVENTS.DEVICE.DELETE, bridge.onDeviceDelete);
    });

    it('should not start twice', async () => {
      await bridge.start();
      const create = sinon.spy(matter.main.ServerNode, 'create');
      await bridge.start();
      sinon.assert.notCalled(create);
    });

    it('should report a node that cannot start', async () => {
      matter.server.start = async () => {
        throw new Error('Cannot bind to {::}:5541');
      };
      await bridge.start();
      expect(bridge.server).to.equal(null);
      expect(matter.server.closed).to.equal(true);
      expect((await bridge.getStatus()).error).to.equal('Cannot bind to {::}:5541');
    });

    it('should leave out a device that cannot be built', async () => {
      const broken = { ...light, id: 'broken-id', selector: 'broken' };
      devices = [broken, light];
      const realAdd = matter.main.Endpoint.prototype.add;
      sinon.stub(matter.main.Endpoint.prototype, 'add').callsFake(async function add(child) {
        if (child.id === 'broken') {
          throw new Error('conformance');
        }
        return realAdd.call(this, child);
      });
      await bridge.start();
      expect(Array.from(bridge.devices.keys())).to.deep.equal(['light-id']);
      matter.main.Endpoint.prototype.add.restore();
    });

    it('should remove the endpoints of a device whose children cannot be added', async () => {
      devices = [sensor];
      const deleteSpy = sinon.spy(matter.main.Endpoint.prototype, 'delete');
      const realAdd = matter.main.Endpoint.prototype.add;
      sinon.stub(matter.main.Endpoint.prototype, 'add').callsFake(async function add(child) {
        if (child.id === 'sensor-humidity-2') {
          throw new Error('conformance');
        }
        return realAdd.call(this, child);
      });
      await bridge.start();
      expect(bridge.devices.size).to.equal(0);
      sinon.assert.calledOnce(deleteSpy);
      matter.main.Endpoint.prototype.add.restore();
      deleteSpy.restore();
    });

    it('should not fail when a device cannot be built at all', async () => {
      devices = [{ ...light, selector: undefined }];
      await bridge.start();
      expect(bridge.devices.size).to.equal(0);
      expect(bridge.server).to.not.equal(null);
    });
  });

  describe('stop', () => {
    it('should close the node and forget the devices', async () => {
      await bridge.start();
      await bridge.stop();
      expect(matter.server.closed).to.equal(true);
      expect(bridge.server).to.equal(null);
      expect(bridge.devices.size).to.equal(0);
      sinon.assert.calledWith(gladys.event.removeListener, EVENTS.TRIGGERS.CHECK, bridge.onTriggerCheck);
    });

    it('should stop when not started', async () => {
      await bridge.stop();
      expect(bridge.server).to.equal(null);
    });

    it('should survive a node failing to close', async () => {
      await bridge.start();
      matter.server.close = async () => {
        throw new Error('closing');
      };
      await bridge.stop();
      expect(bridge.server).to.equal(null);
    });
  });

  describe('reset', () => {
    it('should forget every pairing and restart with a new code', async () => {
      await bridge.start();
      const { passcode } = matter.server.options.commissioning;
      await bridge.reset();
      sinon.assert.calledWith(fse.remove, '/var/lib/gladysassistant/matter-bridge');
      sinon.assert.calledWith(gladys.variable.destroy, VARIABLES.PASSCODE, SERVICE_ID);
      sinon.assert.calledWith(gladys.variable.destroy, VARIABLES.DISCRIMINATOR, SERVICE_ID);
      expect(bridge.server).to.not.equal(null);
      expect(variables[VARIABLES.PASSCODE]).to.not.equal(undefined);
      expect(typeof passcode).to.equal('number');
    });
  });

  describe('live sync', () => {
    beforeEach(async () => {
      await bridge.start();
    });

    it('should forward Gladys states', async () => {
      await bridge.onTriggerCheck({ type: EVENTS.DEVICE.NEW_STATE, device_feature: 'light-binary', last_value: 0 });
      const lightEndpoint = bridge.devices.get('light-id').built.root;
      expect(lightEndpoint.state.onOff.onOff).to.equal(false);
      await bridge.onTriggerCheck({ type: EVENTS.ALARM.ARM, house: 'house' });
    });

    it('should read unknown states as null', () => {
      gladys.stateManager.get.returns(null);
      expect(bridge.readValue({ selector: 'x' })).to.equal(null);
    });

    it('should send Matter commands of a device to Gladys', async () => {
      const coverDevice = {
        id: 'cover-id',
        name: 'Cover',
        selector: 'cover',
        features: [feature('cover-state', 'shutter', 'state')],
      };
      await bridge.onDeviceChange(coverDevice);
      const Behavior = bridge.devices.get('cover-id').built.root.type.behaviors[0];
      new Behavior().handleStopMovement();
      sinon.assert.calledWith(
        gladys.event.emit,
        EVENTS.ACTION.TRIGGERED,
        sinon.match({ device_feature: 'cover-state' }),
      );
    });

    it('should add a created device', async () => {
      const plug = {
        id: 'plug-id',
        name: 'Plug',
        selector: 'plug',
        features: [feature('plug-on', 'switch', 'binary')],
      };
      await bridge.onDeviceChange(plug);
      expect(bridge.devices.has('plug-id')).to.equal(true);
    });

    it('should rename a device in place', async () => {
      const endpoint = bridge.devices.get('light-id').built.root;
      await bridge.onDeviceChange({ ...light, name: 'Kitchen light' });
      expect(bridge.devices.get('light-id').built.root).to.equal(endpoint);
      expect(endpoint.state.bridgedDeviceBasicInformation.nodeLabel).to.equal('Kitchen light');
    });

    it('should keep an unchanged device as it is', async () => {
      const endpoint = bridge.devices.get('light-id').built.root;
      const set = sinon.spy(endpoint, 'set');
      await bridge.onDeviceChange(light);
      sinon.assert.notCalled(set);
    });

    it('should rebuild a changed device under the same endpoint number', async () => {
      const endpoint = bridge.devices.get('light-id').built.root;
      await bridge.onDeviceChange({
        ...light,
        features: [...light.features, feature('light-b', 'battery', 'integer')],
      });
      const rebuilt = bridge.devices.get('light-id').built.root;
      expect(rebuilt).to.not.equal(endpoint);
      expect(endpoint.deleted).to.equal(true);
      expect(rebuilt.number).to.equal(endpoint.number);
      expect(rebuilt.state).to.have.property('powerSource');
    });

    it('should remove a device that has nothing to expose anymore', async () => {
      await bridge.onDeviceChange({ ...light, features: [] });
      expect(bridge.devices.has('light-id')).to.equal(false);
    });

    it('should remove a device taken out of the selection', async () => {
      variables[VARIABLES.EXPOSURE_MODE] = 'selection';
      variables[VARIABLES.EXPOSED_DEVICES] = '["sensor"]';
      await bridge.onDeviceChange(light);
      expect(bridge.devices.has('light-id')).to.equal(false);
    });

    it('should remove a deleted device', async () => {
      await bridge.onDeviceDelete(light);
      expect(bridge.devices.has('light-id')).to.equal(false);
      await bridge.onDeviceDelete(unsupported);
    });

    it('should survive an endpoint failing to be removed', async () => {
      sinon.stub(bridge.devices.get('light-id').built.root, 'delete').rejects(new Error('busy'));
      await bridge.removeDevice('light-id');
      expect(bridge.devices.has('light-id')).to.equal(false);
    });

    it('should ignore device changes once stopped', async () => {
      await bridge.stop();
      await bridge.syncDevice(light);
      expect(bridge.devices.size).to.equal(0);
    });

    it('should keep going after a failing change', async () => {
      await bridge.enqueue(async () => {
        throw new Error('boom');
      });
      let ran = false;
      await bridge.enqueue(async () => {
        ran = true;
      });
      expect(ran).to.equal(true);
    });
  });

  describe('getCompatibleDevices', () => {
    it('should list the devices the bridge can expose', async () => {
      devices = [light, { ...sensor, features: [...sensor.features, feature('b', 'battery', 'integer')] }, unsupported];
      expect(await bridge.getCompatibleDevices()).to.deep.equal([
        { name: 'Light', selector: 'light', functions: ['light'] },
        { name: 'Sensor', selector: 'sensor', functions: ['temperature', 'humidity', 'battery'] },
      ]);
    });
  });

  describe('getStatus', () => {
    it('should describe a stopped bridge', async () => {
      variables[VARIABLES.ENABLED] = 'false';
      expect(await bridge.getStatus()).to.deep.equal({
        enabled: false,
        running: false,
        error: null,
        exposureMode: 'all',
        exposedDevices: [],
        exposedCount: 0,
        commissioned: false,
        qrPairingCode: null,
        manualPairingCode: null,
        fabrics: [],
      });
    });

    it('should describe a running bridge without leaking fabric keys', async () => {
      await bridge.start();
      const status = await bridge.getStatus();
      expect(status).to.include({
        enabled: true,
        running: true,
        exposedCount: 2,
        commissioned: true,
        qrPairingCode: 'MT:QR',
        manualPairingCode: '12345678901',
      });
      expect(status.fabrics).to.deep.equal([{ fabricIndex: 1, label: 'Apple Home', vendorId: 4937 }]);
    });
  });

  describe('saveConfig', () => {
    it('should reject invalid settings', async () => {
      const valid = { enabled: true, exposureMode: 'all', exposedDevices: [] };
      await expect(bridge.saveConfig({ ...valid, enabled: 'yes' })).to.be.rejectedWith(BadParameters);
      await expect(bridge.saveConfig({ ...valid, exposureMode: 'some' })).to.be.rejectedWith(BadParameters);
      await expect(bridge.saveConfig({ ...valid, exposedDevices: 'light' })).to.be.rejectedWith(BadParameters);
      await expect(bridge.saveConfig({ ...valid, exposedDevices: [1] })).to.be.rejectedWith(BadParameters);
      sinon.assert.notCalled(gladys.variable.setValue);
    });

    it('should start the bridge when it is enabled', async () => {
      variables[VARIABLES.ENABLED] = 'false';
      const status = await bridge.saveConfig({ enabled: true, exposureMode: 'selection', exposedDevices: ['light'] });
      expect(variables[VARIABLES.EXPOSED_DEVICES]).to.equal('["light"]');
      expect(variables[VARIABLES.EXPOSURE_MODE]).to.equal('selection');
      expect(variables[VARIABLES.ENABLED]).to.equal('true');
      expect(status.running).to.equal(true);
      expect(status.exposedCount).to.equal(1);
    });

    it('should apply a new selection to a running bridge', async () => {
      await bridge.start();
      const status = await bridge.saveConfig({ enabled: true, exposureMode: 'selection', exposedDevices: ['sensor'] });
      expect(Array.from(bridge.devices.keys())).to.deep.equal(['sensor-id']);
      expect(status.exposedCount).to.equal(1);
    });

    it('should stop the bridge when it is disabled', async () => {
      await bridge.start();
      const status = await bridge.saveConfig({ enabled: false, exposureMode: 'all', exposedDevices: [] });
      expect(status.running).to.equal(false);
      expect(matter.server.closed).to.equal(true);
    });
  });
});
