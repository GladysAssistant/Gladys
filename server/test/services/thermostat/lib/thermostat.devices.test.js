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

// A thermostat now carries its state on features: the setpoint plus preset,
// mode and operating-state, built by the integration rather than taken from the
// payload.
const featureTypes = (created) => created.features.map((feature) => feature.type);

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

    expect(featureTypes(created)).to.deep.equal(['target-temperature', 'preset', 'mode', 'operating-state']);
  });

  it('should keep a single setpoint feature', async () => {
    const handler = buildHandler();

    const created = await handler.createDevice({
      name: 'Salon',
      features: [setpointFeature, { ...setpointFeature, external_id: 'second' }],
    });

    expect(featureTypes(created).filter((type) => type === 'target-temperature')).to.have.lengthOf(1);
  });

  it('should keep a live hold across a save', async () => {
    // `device.create` deletes every param the payload leaves out, and the edit
    // form knows nothing about the hold: without carrying it over, saving the
    // form would drop it and the next pass would overwrite the setpoint the user
    // had just chosen.
    const handler = buildHandler();
    handler.gladys.device.get = fake.resolves([
      {
        selector: 'living-room',
        params: [
          { name: 'THERMOSTAT_MANUAL_SETPOINT', value: '21.5' },
          { name: 'THERMOSTAT_MANUAL_UNTIL', value: '1700000000000' },
        ],
      },
    ]);

    const created = await handler.createDevice({ name: 'Salon', selector: 'living-room', features: [setpointFeature] });

    const names = created.params.map((param) => param.name);
    expect(names).to.include('THERMOSTAT_MANUAL_SETPOINT');
    expect(names).to.include('THERMOSTAT_MANUAL_UNTIL');
    expect(created.params.find((param) => param.name === 'THERMOSTAT_MANUAL_SETPOINT').value).to.equal('21.5');
  });

  it('should let the caller clear a hold explicitly', async () => {
    const handler = buildHandler();
    handler.gladys.device.get = fake.resolves([
      { selector: 'living-room', params: [{ name: 'THERMOSTAT_MANUAL_SETPOINT', value: '21.5' }] },
    ]);

    const created = await handler.createDevice({
      name: 'Salon',
      selector: 'living-room',
      features: [setpointFeature],
      params: [{ name: 'THERMOSTAT_MANUAL_SETPOINT', value: '' }],
    });

    expect(created.params.find((param) => param.name === 'THERMOSTAT_MANUAL_SETPOINT').value).to.equal('');
  });

  it('should not carry a hold the caller did not have', async () => {
    // The device exists but carries no hold: nothing to preserve.
    const handler = buildHandler();
    handler.gladys.device.get = fake.resolves([{ selector: 'living-room', params: [] }]);

    const created = await handler.createDevice({ name: 'Salon', selector: 'living-room', features: [setpointFeature] });

    expect(created.params.map((param) => param.name)).to.not.include('THERMOSTAT_MANUAL_SETPOINT');
  });

  it('should carry only the hold params the device actually has', async () => {
    // A setpoint held with no expiry — the permanent hold of a thermostat that
    // follows no schedule: only the one param is carried.
    const handler = buildHandler();
    handler.gladys.device.get = fake.resolves([
      { selector: 'living-room', params: [{ name: 'THERMOSTAT_MANUAL_SETPOINT', value: '19' }] },
    ]);

    const created = await handler.createDevice({ name: 'Salon', selector: 'living-room', features: [setpointFeature] });

    const names = created.params.map((param) => param.name);
    expect(names).to.include('THERMOSTAT_MANUAL_SETPOINT');
    expect(names).to.not.include('THERMOSTAT_MANUAL_UNTIL');
  });

  it('should survive a device that cannot be read back', async () => {
    const handler = buildHandler();
    handler.gladys.device.get = fake.resolves(null);

    const created = await handler.createDevice({ name: 'Salon', selector: 'living-room', features: [setpointFeature] });

    expect(created.name).to.equal('Salon');
  });

  it('should carry no hold onto a device being created', async () => {
    const handler = buildHandler();
    handler.gladys.device.get = fake.resolves([
      { selector: 'someone-else', params: [{ name: 'THERMOSTAT_MANUAL_SETPOINT', value: '21.5' }] },
    ]);

    // No selector yet: there is nothing of its own to carry over, and another
    // device's hold must not leak onto it.
    const created = await handler.createDevice({ name: 'Salon', features: [setpointFeature] });

    expect(created.params.map((param) => param.name)).to.not.include('THERMOSTAT_MANUAL_SETPOINT');
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

  it('should carry the preset and the mode, and nothing else of its own', async () => {
    const handler = buildHandler();

    const created = await handler.createDevice({ name: 'Netatmo', params: externalParams });

    // The real device owns its setpoint and its running state. The preset and
    // the mode are Gladys's own: no thermostat publishes Gladys's presets, and
    // "stopped by Gladys" is a decision this service takes — a Netatmo does not
    // even expose a mode of its own.
    expect(featureTypes(created)).to.deep.equal(['preset', 'mode']);
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

    expect(featureTypes(created)).to.deep.equal(['preset', 'mode']);
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
  const buildHandler = () => ({
    invalidateDeviceCaches: fake.returns(null),
    postDelete,
  });

  it('should drop the caches derived from the device list', async () => {
    // The features, the params and the schedule link all go with the device row,
    // so there is no state left to clean up: only the caches, or the next pass
    // would still regulate a thermostat that no longer exists.
    const handler = buildHandler();

    await handler.postDelete({ features: [{ selector: 'thermostat-living-room' }] });

    assert.calledOnce(handler.invalidateDeviceCaches);
  });

  it('should not need the deleted device to carry anything', async () => {
    const handler = buildHandler();

    await handler.postDelete({});

    assert.calledOnce(handler.invalidateDeviceCaches);
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
