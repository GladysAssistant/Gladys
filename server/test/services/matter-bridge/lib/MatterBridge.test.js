const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { EVENTS } = require('../../../../utils/constants');
const { BadParameters, ConflictError } = require('../../../../utils/coreErrors');
const { VARIABLES, ERROR_CODES } = require('../../../../services/matter-bridge/lib/constants');
const { createMatter, feature } = require('../fakes');

const fse = { ensureDir: sinon.stub().resolves(), remove: sinon.stub().resolves() };
const checkIpv6 = sinon.stub().returns({ hasIpv6: true, ipv6Interfaces: [] });
const MatterBridge = proxyquire('../../../../services/matter-bridge/lib/MatterBridge', {
  'fs-extra': fse,
  '../../../utils/checkIpv6': { checkIpv6 },
});

const SERVICE_ID = 'a810b8db-6d04-4697-bed3-c4b72c996279';

describe('MatterBridge', () => {
  let gladys;
  let variables;
  let devices;
  let matter;
  let bridge;
  let matterbridgeEnabled;

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
    matterbridgeEnabled = false;
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
      service: {
        getService: sinon
          .stub()
          .callsFake((name) =>
            name === 'matterbridge' ? { device: { isEnabled: async () => matterbridgeEnabled } } : null,
          ),
      },
    };
    matter = createMatter();
    bridge = new MatterBridge(gladys, SERVICE_ID, () => matter);
  });

  afterEach(() => {
    sinon.resetHistory();
    fse.remove.resetBehavior();
    fse.remove.resolves();
  });

  describe('start', () => {
    it('should not start when disabled, nor load matter.js', async () => {
      const loadMatter = sinon.stub().returns(matter);
      bridge = new MatterBridge(gladys, SERVICE_ID, loadMatter);
      variables[VARIABLES.ENABLED] = 'false';
      await bridge.start();
      expect(bridge.server).to.equal(null);
      sinon.assert.notCalled(fse.ensureDir);
      sinon.assert.notCalled(loadMatter);
    });

    it('should load matter.js once, at the first start', async () => {
      const loadMatter = sinon.stub().returns(matter);
      bridge = new MatterBridge(gladys, SERVICE_ID, loadMatter);
      await bridge.start();
      await bridge.stop();
      await bridge.start();
      sinon.assert.calledOnce(loadMatter);
      expect(bridge.matter).to.equal(matter);
    });

    it('should start the node with the exposed devices', async () => {
      await bridge.start();
      expect(matter.server.started).to.equal(true);
      expect(matter.vars.get('storage.path')).to.equal('/var/lib/gladysassistant/matter-bridge');
      const { options } = matter.server;
      expect(options.network).to.deep.equal({ port: 5540 });
      expect(options.commissioning.passcode).to.be.a('number');
      expect(options.basicInformation).to.include({ softwareVersion: 47001, softwareVersionString: '4.70.1' });
      expect(options.basicInformation.uniqueId).to.not.equal(options.basicInformation.serialNumber);
      const [aggregator] = matter.server.added;
      expect(aggregator.id).to.equal('aggregator');
      expect(aggregator.children.map((c) => c.id)).to.deep.equal(['light', 'sensor']);
      expect(aggregator.children[0].children.map((c) => c.id)).to.deep.equal(['light-light-1']);
      expect(aggregator.children[1].children.map((c) => c.id)).to.deep.equal([
        'sensor-temperature-1',
        'sensor-humidity-1',
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
        throw new Error('Cannot bind to {::}:5540 (code EAFNOSUPPORT)');
      };
      await bridge.start();
      expect(bridge.server).to.equal(null);
      expect(matter.server.closed).to.equal(true);
      const status = await bridge.getStatus();
      expect(status.error).to.equal('Cannot bind to {::}:5540 (code EAFNOSUPPORT)');
      expect(status.errorCode).to.equal(null);
    });

    it('should not start when the Matter port is already in use', async () => {
      matter.server.start = async () => {
        throw new matter.main.AddressInUseError('Cannot bind [::]:5540 because port is already in use');
      };
      await bridge.start();
      expect(bridge.server).to.equal(null);
      expect(matter.server.closed).to.equal(true);
      sinon.assert.calledWith(gladys.event.removeListener, EVENTS.DEVICE.CREATE, bridge.onDeviceChange);
      const status = await bridge.getStatus();
      expect(status).to.include({
        enabled: true,
        running: false,
        error: 'Port 5540 is already in use by another program',
        errorCode: ERROR_CODES.PORT_IN_USE,
      });
    });

    it('should find a port in use behind the error matter.js reports', async () => {
      matter.server.start = async () => {
        const error = new Error('Behaviors have errors');
        error.cause = Object.assign(new Error('bind EADDRINUSE'), { code: 'EADDRINUSE' });
        throw error;
      };
      await bridge.start();
      expect((await bridge.getStatus()).errorCode).to.equal(ERROR_CODES.PORT_IN_USE);
    });

    it('should forget the error of a previous start once started', async () => {
      const realStart = matter.server.start;
      matter.server.start = async () => {
        throw new matter.main.AddressInUseError('port is already in use');
      };
      await bridge.start();
      matter.server.start = realStart;
      await bridge.start();
      const status = await bridge.getStatus();
      expect(status.running).to.equal(true);
      expect(status.error).to.equal(null);
      expect(status.errorCode).to.equal(null);
    });

    it('should not start while the Matterbridge integration is enabled', async () => {
      matterbridgeEnabled = true;
      const create = sinon.spy(matter.main.ServerNode, 'create');
      await bridge.start();
      sinon.assert.notCalled(create);
      expect(bridge.server).to.equal(null);
      const status = await bridge.getStatus();
      expect(status).to.include({
        enabled: true,
        running: false,
        matterbridgeEnabled: true,
        errorCode: ERROR_CODES.MATTERBRIDGE_ENABLED,
      });
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
        if (child.id === 'sensor-humidity-1') {
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
      expect(matter.server.options.commissioning.passcode).to.not.equal(passcode);
    });

    it('should report a reset that fails, without restarting the bridge', async () => {
      await bridge.start();
      bridge.setError('port in use', ERROR_CODES.PORT_IN_USE);
      fse.remove.rejects(new Error('read-only'));
      await bridge.reset();
      expect(bridge.server).to.equal(null);
      expect(bridge.online).to.equal(false);
      expect(bridge.lastError).to.equal('Unable to reset: read-only');
      expect(bridge.lastErrorCode).to.equal(null);
      sinon.assert.notCalled(gladys.variable.destroy);
    });
  });

  describe('serialization', () => {
    it('should create a single node when the bridge is started twice at once', async () => {
      const create = sinon.spy(matter.main.ServerNode, 'create');
      await Promise.all([bridge.start(), bridge.start()]);
      sinon.assert.calledOnce(create);
      create.restore();
    });

    it('should not apply a change queued before a stop to the closed bridge', async () => {
      await bridge.start();
      const created = { ...light, id: 'new-id', selector: 'new' };
      await Promise.all([bridge.stop(), bridge.onDeviceChange(created)]);
      expect(bridge.devices.size).to.equal(0);
    });
  });

  describe('live sync', () => {
    beforeEach(async () => {
      await bridge.start();
    });

    it('should forward Gladys states', async () => {
      await bridge.onTriggerCheck({ type: EVENTS.DEVICE.NEW_STATE, device_feature: 'light-binary', last_value: 0 });
      const [lightEndpoint] = bridge.devices.get('light-id').built.children;
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
      const Behavior = bridge.devices.get('cover-id').built.children[0].type.behaviors[0];
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

    it('should rebuild a changed device under the same endpoint numbers', async () => {
      const { root: endpoint, children } = bridge.devices.get('light-id').built;
      await bridge.onDeviceChange({
        ...light,
        features: [...light.features, feature('light-b', 'battery', 'integer')],
      });
      const rebuilt = bridge.devices.get('light-id').built;
      expect(rebuilt.root).to.not.equal(endpoint);
      expect(endpoint.deleted).to.equal(true);
      expect(rebuilt.root.number).to.equal(endpoint.number);
      expect(rebuilt.children[0].id).to.equal(children[0].id);
      expect(rebuilt.children[0].number).to.equal(children[0].number);
      expect(rebuilt.root.state).to.have.property('powerSource');
    });

    it('should keep the endpoint of a function when the device gains another one', async () => {
      const [lightEndpoint] = bridge.devices.get('light-id').built.children;
      await bridge.onDeviceChange({
        ...light,
        features: [...light.features, feature('light-t', 'temperature-sensor', 'decimal')],
      });
      const rebuilt = bridge.devices.get('light-id').built.children;
      expect(rebuilt.map((c) => c.id)).to.deep.equal(['light-light-1', 'light-temperature-1']);
      expect(rebuilt[0].number).to.equal(lightEndpoint.number);
      expect(rebuilt[1].number).to.not.equal(lightEndpoint.number);
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

    it('should keep synchronizing the other devices when one fails', async () => {
      const other = { ...light, id: 'other-id', selector: 'other' };
      devices = [light, other, sensor];
      const upsertDevice = bridge.upsertDevice.bind(bridge);
      sinon.stub(bridge, 'upsertDevice').callsFake(async (device) => {
        if (device.id !== 'sensor-id') {
          throw new Error('broken');
        }
        return upsertDevice(device);
      });
      await bridge.saveConfig({ exposureMode: 'selection', exposedDevices: ['light', 'other'] });
      // The light keeps the endpoints it had, the other one was never on the bridge, and the sensor
      // taken out of the selection is removed all the same.
      expect(Array.from(bridge.devices.keys())).to.deep.equal(['light-id']);
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

  describe('isMatterbridgeEnabled', () => {
    it('should read the state of the Matterbridge integration', async () => {
      expect(await bridge.isMatterbridgeEnabled()).to.equal(false);
      matterbridgeEnabled = true;
      expect(await bridge.isMatterbridgeEnabled()).to.equal(true);
      sinon.assert.calledWith(gladys.service.getService, 'matterbridge');
    });

    it('should tell the Matterbridge integration is not enabled when it is not loaded', async () => {
      gladys.service.getService = sinon.stub().returns(null);
      expect(await bridge.isMatterbridgeEnabled()).to.equal(false);
      gladys.service.getService = sinon.stub().returns({});
      expect(await bridge.isMatterbridgeEnabled()).to.equal(false);
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
    it('should tell the bridge has IPv6 with a link-local address only', async () => {
      await bridge.getStatus();
      sinon.assert.calledWithExactly(checkIpv6, undefined, { allowLinkLocal: true });
    });

    it('should not describe a bridge still starting as running', async () => {
      let statusWhileStarting;
      const { start } = matter.server;
      matter.server.start = async () => {
        statusWhileStarting = await bridge.getStatus();
        return start();
      };
      await bridge.start();
      expect(statusWhileStarting).to.include({
        running: false,
        commissioned: false,
        qrPairingCode: null,
        manualPairingCode: null,
      });
      expect((await bridge.getStatus()).running).to.equal(true);
    });

    it('should describe a running bridge whose pairing codes are not ready', async () => {
      await bridge.start();
      delete matter.server.state.commissioning.pairingCodes;
      expect(await bridge.getStatus()).to.include({ running: true, qrPairingCode: null, manualPairingCode: null });
    });

    it('should describe a stopped bridge', async () => {
      variables[VARIABLES.ENABLED] = 'false';
      checkIpv6.returns({ hasIpv6: false, ipv6Interfaces: [] });
      expect(await bridge.getStatus()).to.deep.equal({
        enabled: false,
        hasIpv6: false,
        matterbridgeEnabled: false,
        port: 5540,
        running: false,
        error: null,
        errorCode: null,
        exposureMode: 'all',
        exposedDevices: [],
        exposedCount: 0,
        commissioned: false,
        qrPairingCode: null,
        manualPairingCode: null,
        fabrics: [],
      });
      checkIpv6.returns({ hasIpv6: true, ipv6Interfaces: [] });
    });

    it('should describe a running bridge without leaking fabric keys', async () => {
      await bridge.start();
      const status = await bridge.getStatus();
      expect(status).to.include({
        enabled: true,
        hasIpv6: true,
        running: true,
        exposedCount: 2,
        commissioned: true,
        qrPairingCode: 'MT:QR',
        manualPairingCode: '12345678901',
      });
      expect(status.fabrics).to.deep.equal([{ fabricIndex: 1, label: 'Apple Home', vendorId: 4937 }]);
    });
  });

  describe('setEnabled', () => {
    it('should turn the bridge on', async () => {
      variables[VARIABLES.ENABLED] = 'false';
      const status = await bridge.setEnabled(true);
      expect(variables[VARIABLES.ENABLED]).to.equal('true');
      expect(status.enabled).to.equal(true);
      expect(status.running).to.equal(true);
    });

    it('should refuse to turn the bridge on while the Matterbridge integration is enabled', async () => {
      variables[VARIABLES.ENABLED] = 'false';
      matterbridgeEnabled = true;
      await expect(bridge.setEnabled(true)).to.be.rejectedWith(ConflictError);
      expect(variables[VARIABLES.ENABLED]).to.equal('false');
      expect(bridge.server).to.equal(null);
    });

    it('should turn the bridge off while the Matterbridge integration is enabled', async () => {
      matterbridgeEnabled = true;
      const status = await bridge.setEnabled(false);
      expect(variables[VARIABLES.ENABLED]).to.equal('false');
      expect(status.enabled).to.equal(false);
    });

    it('should turn the bridge off', async () => {
      await bridge.start();
      const status = await bridge.setEnabled(false);
      expect(variables[VARIABLES.ENABLED]).to.equal('false');
      expect(status.running).to.equal(false);
      expect(matter.server.closed).to.equal(true);
    });
  });

  describe('saveConfig', () => {
    it('should reject invalid settings', async () => {
      const valid = { exposureMode: 'all', exposedDevices: [] };
      await expect(bridge.saveConfig({ ...valid, exposureMode: 'some' })).to.be.rejectedWith(BadParameters);
      await expect(bridge.saveConfig({ ...valid, exposedDevices: 'light' })).to.be.rejectedWith(BadParameters);
      await expect(bridge.saveConfig({ ...valid, exposedDevices: [1] })).to.be.rejectedWith(BadParameters);
      sinon.assert.notCalled(gladys.variable.setValue);
    });

    it('should save the selection of a stopped bridge without starting it', async () => {
      variables[VARIABLES.ENABLED] = 'false';
      const status = await bridge.saveConfig({ exposureMode: 'selection', exposedDevices: ['light'] });
      expect(variables[VARIABLES.EXPOSED_DEVICES]).to.equal('["light"]');
      expect(variables[VARIABLES.EXPOSURE_MODE]).to.equal('selection');
      expect(variables[VARIABLES.ENABLED]).to.equal('false');
      expect(status.running).to.equal(false);
    });

    it('should put the previous selection back when the mode cannot be saved', async () => {
      variables[VARIABLES.EXPOSED_DEVICES] = '["sensor"]';
      const { setValue } = gladys.variable;
      gladys.variable.setValue = sinon.stub().callsFake(async (name, value) => {
        if (name === VARIABLES.EXPOSURE_MODE) {
          throw new Error('database locked');
        }
        return setValue(name, value);
      });
      await expect(bridge.saveConfig({ exposureMode: 'selection', exposedDevices: ['light'] })).to.be.rejectedWith(
        'database locked',
      );
      expect(variables[VARIABLES.EXPOSED_DEVICES]).to.equal('["sensor"]');
      expect(variables).to.not.have.property(VARIABLES.EXPOSURE_MODE);
    });

    it('should remove a selection that did not exist when the mode cannot be saved', async () => {
      gladys.variable.setValue = sinon.stub().callsFake(async (name, value) => {
        if (name === VARIABLES.EXPOSURE_MODE) {
          throw new Error('database locked');
        }
        variables[name] = value;
      });
      await expect(bridge.saveConfig({ exposureMode: 'selection', exposedDevices: ['light'] })).to.be.rejectedWith(
        'database locked',
      );
      expect(variables).to.not.have.property(VARIABLES.EXPOSED_DEVICES);
      sinon.assert.calledWith(gladys.variable.destroy, VARIABLES.EXPOSED_DEVICES, SERVICE_ID);
    });

    it('should not sync a bridge stopped by a stop queued before the save', async () => {
      await bridge.start();
      const syncAll = sinon.spy(bridge, 'syncAll');
      // A change still running holds the stop in the queue while the configuration is saved.
      let release;
      const gate = new Promise((resolve) => {
        release = resolve;
      });
      const busy = bridge.enqueue(() => gate);
      const stopped = bridge.stop();
      const saved = bridge.saveConfig({ exposureMode: 'selection', exposedDevices: ['sensor'] });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      release();
      const [status] = await Promise.all([saved, busy, stopped]);
      sinon.assert.notCalled(syncAll);
      expect(status.running).to.equal(false);
    });

    it('should apply a new selection to a running bridge', async () => {
      await bridge.start();
      const status = await bridge.saveConfig({ exposureMode: 'selection', exposedDevices: ['sensor'] });
      expect(Array.from(bridge.devices.keys())).to.deep.equal(['sensor-id']);
      expect(status.exposedCount).to.equal(1);
    });
  });
});
