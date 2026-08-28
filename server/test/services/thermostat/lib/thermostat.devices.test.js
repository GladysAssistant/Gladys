const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const stubLogger = {
  '../../../utils/logger': {
    debug: fake.returns(null),
    info: fake.returns(null),
    warn: fake.returns(null),
  },
};

const { createDevice } = proxyquire('../../../../services/thermostat/lib/thermostat.createDevice', stubLogger);
const { getDevices } = proxyquire('../../../../services/thermostat/lib/thermostat.getDevices', stubLogger);
const { postDelete } = proxyquire('../../../../services/thermostat/lib/thermostat.postDelete', stubLogger);

const setpointFeature = {
  name: 'Thermostat Salon',
  external_id: 'thermostat:salon:target-temperature',
  category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
  type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
};

describe('thermostat.getDevices', () => {
  it('should only ask for the devices of this service', async () => {
    const handler = { gladys: { device: { get: fake.resolves([]) } }, getDevices };

    await handler.getDevices();

    assert.calledWith(handler.gladys.device.get, { service: 'thermostat' });
  });

  it('should forward the search and order filters', async () => {
    const handler = { gladys: { device: { get: fake.resolves([]) } }, getDevices };

    await handler.getDevices({ search: 'salon', order_dir: 'desc' });

    assert.calledWith(handler.gladys.device.get, { service: 'thermostat', search: 'salon', order_dir: 'desc' });
  });

  it('should leave out an empty search or order', async () => {
    const handler = { gladys: { device: { get: fake.resolves([]) } }, getDevices };

    await handler.getDevices({ search: '', order_dir: '' });

    assert.calledWith(handler.gladys.device.get, { service: 'thermostat' });
  });

  it('should return the devices found', async () => {
    const devices = [{ selector: 'my-thermostat' }];
    const handler = { gladys: { device: { get: fake.resolves(devices) } }, getDevices };

    expect(await handler.getDevices()).to.deep.equal(devices);
  });
});

describe('thermostat.createDevice', () => {
  const buildHandler = () => ({
    gladys: { device: { create: fake((device) => Promise.resolve(device)) } },
    serviceId: 'service-id',
    invalidateDeviceCaches: fake.returns(null),
    createDevice,
  });

  it('should create the device on this service', async () => {
    const handler = buildHandler();

    const created = await handler.createDevice({ name: 'Salon', features: [setpointFeature] });

    expect(created.service_id).to.equal('service-id');
    expect(created.name).to.equal('Salon');
  });

  it('should refuse a device without a setpoint feature', async () => {
    const handler = buildHandler();

    let error = null;
    try {
      await handler.createDevice({ name: 'Salon', features: [] });
    } catch (e) {
      error = e;
    }

    expect(error).to.not.equal(null);
    expect(error.message).to.contain('target-temperature');
    assert.notCalled(handler.gladys.device.create);
  });

  it('should drop features that are not a thermostat setpoint', async () => {
    const handler = buildHandler();

    const created = await handler.createDevice({
      name: 'Salon',
      features: [{ category: 'light', type: 'binary' }, setpointFeature],
    });

    expect(created.features).to.deep.equal([setpointFeature]);
  });

  it('should keep a single setpoint feature', async () => {
    const handler = buildHandler();

    const created = await handler.createDevice({
      name: 'Salon',
      features: [setpointFeature, { ...setpointFeature, external_id: 'second' }],
    });

    expect(created.features).to.have.lengthOf(1);
  });

  it('should drop params outside the thermostat namespace', async () => {
    const handler = buildHandler();

    const created = await handler.createDevice({
      name: 'Salon',
      features: [setpointFeature],
      params: [
        { name: 'THERMOSTAT_SWITCH_FEATURE', value: 'heater-switch' },
        { name: 'SOMETHING_ELSE', value: 'nope' },
      ],
    });

    expect(created.params).to.deep.equal([{ name: 'THERMOSTAT_SWITCH_FEATURE', value: 'heater-switch' }]);
  });

  it('should not forward unknown top-level fields', async () => {
    const handler = buildHandler();

    const created = await handler.createDevice({
      name: 'Salon',
      features: [setpointFeature],
      activeSchedule: 'my-schedule',
    });

    expect(created).to.not.have.property('activeSchedule');
  });

  it('should tolerate a device without params', async () => {
    const handler = buildHandler();

    const created = await handler.createDevice({ name: 'Salon', features: [setpointFeature] });

    expect(created.params).to.deep.equal([]);
  });

  it('should keep the min/max, unit and manual duration params the form owns', async () => {
    const handler = buildHandler();

    const created = await handler.createDevice({
      name: 'Salon',
      features: [setpointFeature],
      params: [
        { name: 'THERMOSTAT_MIN_TEMP', value: '5' },
        { name: 'THERMOSTAT_MAX_TEMP', value: '35' },
        { name: 'THERMOSTAT_TEMP_UNIT', value: 'C' },
        { name: 'THERMOSTAT_MANUAL_DURATION', value: '45' },
      ],
    });

    expect(created.params.map((param) => param.name)).to.have.members([
      'THERMOSTAT_MIN_TEMP',
      'THERMOSTAT_MAX_TEMP',
      'THERMOSTAT_TEMP_UNIT',
      'THERMOSTAT_MANUAL_DURATION',
    ]);
  });

  it('should drop the cached window selectors', async () => {
    const handler = buildHandler();

    await handler.createDevice({ name: 'Salon', features: [setpointFeature] });

    assert.calledOnce(handler.invalidateDeviceCaches);
  });
});

// An external thermostat drives a real device: it carries no setpoint feature
// of its own, and is identified by the THERMOSTAT_TARGET_FEATURE param instead.
describe('thermostat.createDevice - external', () => {
  const buildHandler = () => ({
    gladys: { device: { create: fake((device) => Promise.resolve(device)) } },
    serviceId: 'service-id',
    invalidateDeviceCaches: fake.returns(null),
    createDevice,
  });

  const externalParams = [
    { name: 'THERMOSTAT_TYPE', value: 'external' },
    { name: 'THERMOSTAT_TARGET_FEATURE', value: 'netatmo-setpoint' },
  ];

  it('should create the device without any feature of its own', async () => {
    const handler = buildHandler();

    const created = await handler.createDevice({ name: 'Netatmo', params: externalParams });

    expect(created.features).to.deep.equal([]);
    expect(created.service_id).to.equal('service-id');
  });

  // Creating one would give the house two setpoints that drift apart.
  it('should drop a setpoint feature sent alongside an external device', async () => {
    const handler = buildHandler();

    const created = await handler.createDevice({
      name: 'Netatmo',
      features: [setpointFeature],
      params: externalParams,
    });

    expect(created.features).to.deep.equal([]);
  });

  it('should keep the external params', async () => {
    const handler = buildHandler();

    const created = await handler.createDevice({ name: 'Netatmo', params: externalParams });

    expect(created.params.map((param) => param.name)).to.have.members(['THERMOSTAT_TYPE', 'THERMOSTAT_TARGET_FEATURE']);
  });

  // Without a target there is nothing to drive: the device would sit in the
  // integration page doing nothing, with no way to tell why.
  it('should refuse an external thermostat with no target feature', async () => {
    const handler = buildHandler();

    let error = null;
    try {
      await handler.createDevice({ name: 'Netatmo', params: [{ name: 'THERMOSTAT_TYPE', value: 'external' }] });
    } catch (e) {
      error = e;
    }

    expect(error).to.be.an('error');
    assert.notCalled(handler.gladys.device.create);
  });

  it('should refuse an external thermostat whose target feature is empty', async () => {
    const handler = buildHandler();

    let error = null;
    try {
      await handler.createDevice({
        name: 'Netatmo',
        params: [
          { name: 'THERMOSTAT_TYPE', value: 'external' },
          { name: 'THERMOSTAT_TARGET_FEATURE', value: '' },
        ],
      });
    } catch (e) {
      error = e;
    }

    expect(error).to.be.an('error');
  });

  // A device saved with the virtual type still needs its own feature.
  it('should still require a feature when the type param says virtual', async () => {
    const handler = buildHandler();

    let error = null;
    try {
      await handler.createDevice({
        name: 'Salon',
        features: [],
        params: [{ name: 'THERMOSTAT_TYPE', value: 'virtual' }],
      });
    } catch (e) {
      error = e;
    }

    expect(error).to.be.an('error');
  });
});

describe('thermostat.postDelete', () => {
  const buildHandler = (destroy) => ({
    gladys: { variable: { destroy } },
    serviceId: 'service-id',
    invalidateDeviceCaches: fake.returns(null),
    postDelete,
  });

  it('should remove every runtime variable of the deleted features', async () => {
    const handler = buildHandler(fake.resolves(null));

    await handler.postDelete({ features: [{ selector: 'thermostat-living-room' }] });

    const keys = handler.gladys.variable.destroy.getCalls().map((call) => call.args[0]);
    // The configuration is not in this list: it lives on the device row, which
    // is deleted with the device itself.
    expect(keys).to.have.members([
      'THERMOSTAT_THERMOSTAT_LIVING_ROOM_PRESET',
      'THERMOSTAT_THERMOSTAT_LIVING_ROOM_PRESET_FALLBACK',
      'THERMOSTAT_THERMOSTAT_LIVING_ROOM_MANUAL_MODE',
      'THERMOSTAT_THERMOSTAT_LIVING_ROOM_MANUAL_UNTIL',
      'THERMOSTAT_THERMOSTAT_LIVING_ROOM_MANUAL_SETPOINT',
    ]);
  });

  // An external thermostat carries no feature: its runtime state is keyed on the
  // real device's setpoint feature, which survives the deletion (it belongs to
  // another integration) — only the variables go.
  it('should remove the runtime variables of an external thermostat', async () => {
    const handler = buildHandler(fake.resolves(null));

    await handler.postDelete({
      features: [],
      params: [{ name: 'THERMOSTAT_TARGET_FEATURE', value: 'netatmo-setpoint' }],
    });

    const keys = handler.gladys.variable.destroy.getCalls().map((call) => call.args[0]);
    expect(keys).to.have.members([
      'THERMOSTAT_NETATMO_SETPOINT_PRESET',
      'THERMOSTAT_NETATMO_SETPOINT_PRESET_FALLBACK',
      'THERMOSTAT_NETATMO_SETPOINT_MANUAL_MODE',
      'THERMOSTAT_NETATMO_SETPOINT_MANUAL_UNTIL',
      'THERMOSTAT_NETATMO_SETPOINT_MANUAL_SETPOINT',
    ]);
  });

  // A virtual thermostat left with a stale target param must not have its
  // variables cleaned up twice.
  it('should not clean the same selector twice', async () => {
    const handler = buildHandler(fake.resolves(null));

    await handler.postDelete({
      features: [{ selector: 'netatmo-setpoint' }],
      params: [{ name: 'THERMOSTAT_TARGET_FEATURE', value: 'netatmo-setpoint' }],
    });

    expect(handler.gladys.variable.destroy.callCount).to.equal(5);
  });

  it('should ignore a device with no params at all', async () => {
    const handler = buildHandler(fake.resolves(null));

    await handler.postDelete({ features: [{ selector: 'thermostat-living-room' }] });

    expect(handler.gladys.variable.destroy.callCount).to.equal(5);
  });

  it('should remove the variables in this service scope', async () => {
    const handler = buildHandler(fake.resolves(null));

    await handler.postDelete({ features: [{ selector: 'thermostat-living-room' }] });

    handler.gladys.variable.destroy.getCalls().forEach((call) => {
      expect(call.args[1]).to.equal('service-id');
    });
  });

  it('should swallow a variable that cannot be removed', async () => {
    const handler = buildHandler(fake.rejects(new Error('gone')));

    await handler.postDelete({ features: [{ selector: 'thermostat-living-room' }] });

    assert.called(handler.gladys.variable.destroy);
  });

  it('should do nothing for a device without features', async () => {
    const handler = buildHandler(fake.resolves(null));

    await handler.postDelete({});

    assert.notCalled(handler.gladys.variable.destroy);
  });

  it('should do nothing when no device is given', async () => {
    const handler = buildHandler(fake.resolves(null));

    await handler.postDelete(undefined);

    assert.notCalled(handler.gladys.variable.destroy);
  });
});

describe('thermostat.createDevice - defensive paths', () => {
  it('should refuse a device with no features field at all', async () => {
    const handler = {
      gladys: { device: { create: fake.resolves(null) } },
      serviceId: 'service-id',
      invalidateDeviceCaches: fake.returns(null),
      createDevice,
    };

    let error = null;
    try {
      await handler.createDevice({ name: 'Salon' });
    } catch (e) {
      error = e;
    }

    expect(error).to.not.equal(null);
    assert.notCalled(handler.gladys.device.create);
  });
});
