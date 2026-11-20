const { expect } = require('chai');

const db = require('../../models');

const migration = require('../../migrations/20261113000000-thermostat-matter-default-range');

const THERMOSTAT_SERVICE_ID = '2f4a6c8e-0b1d-4c3e-9a5b-7d9f1b3c5e7a';
const OTHER_SERVICE_ID = '8b0d2f4a-6c8e-4a1b-8d3f-5b7d9f1a3c5e';
const MATTER_RANGE_DEVICE_ID = '3a5c7e9b-1d3f-4b5d-8f7a-9c1e3a5b7d9f';
const USER_RANGE_DEVICE_ID = '5c7e9a1b-3d5f-4d7b-9a9c-1e3a5c7b9d1f';
const LONE_BOUND_DEVICE_ID = '7e9a1c3b-5d7f-4f9d-8b1e-3a5c7e9b1d3f';
const OTHER_DEVICE_ID = '9a1c3e5b-7d9f-4b1d-9d3a-5c7e9a1b3d5f';

const createService = (id, name) =>
  db.Service.create({ id, name, selector: name, version: '0.1.0', has_message_feature: false });

const createDevice = async (serviceId, deviceId, slug, params) => {
  await db.Device.create({
    id: deviceId,
    name: slug,
    selector: slug,
    external_id: `${slug}:device`,
    service_id: serviceId,
  });
  await db.DeviceParam.bulkCreate(
    Object.keys(params).map((name) => ({ device_id: deviceId, name, value: params[name] })),
  );
};

const paramsOf = async (deviceId) => {
  const params = await db.DeviceParam.findAll({ where: { device_id: deviceId } });
  return params.reduce((all, param) => ({ ...all, [param.name]: param.value }), {});
};

describe('migration 20261113000000-thermostat-matter-default-range', () => {
  it('should do nothing when the thermostat service is not installed', async () => {
    await migration.up();
  });

  it('should do nothing when no thermostat carries the Matter range', async () => {
    await createService(THERMOSTAT_SERVICE_ID, 'thermostat');
    await createDevice(THERMOSTAT_SERVICE_ID, USER_RANGE_DEVICE_ID, 'bedroom-thermostat', {
      THERMOSTAT_MIN_TEMP: '8',
      THERMOSTAT_MAX_TEMP: '25',
    });

    await migration.up();

    expect(await paramsOf(USER_RANGE_DEVICE_ID)).to.deep.equal({
      THERMOSTAT_MIN_TEMP: '8',
      THERMOSTAT_MAX_TEMP: '25',
    });
  });

  it('should drop the Matter range of a thermostat, and leave every other range alone', async () => {
    await createService(THERMOSTAT_SERVICE_ID, 'thermostat');
    await createDevice(THERMOSTAT_SERVICE_ID, MATTER_RANGE_DEVICE_ID, 'living-room-thermostat', {
      THERMOSTAT_TYPE: 'external',
      THERMOSTAT_MIN_TEMP: '-100',
      THERMOSTAT_MAX_TEMP: '200',
    });
    await createDevice(THERMOSTAT_SERVICE_ID, USER_RANGE_DEVICE_ID, 'bedroom-thermostat', {
      THERMOSTAT_MIN_TEMP: '8',
      THERMOSTAT_MAX_TEMP: '25',
    });
    // Half of the pair is not what the form saved: someone set it.
    await createDevice(THERMOSTAT_SERVICE_ID, LONE_BOUND_DEVICE_ID, 'office-thermostat', {
      THERMOSTAT_MIN_TEMP: '-100',
      THERMOSTAT_MAX_TEMP: '30',
    });
    // The same param names on a device of another service are not ours.
    await createService(OTHER_SERVICE_ID, 'matter');
    await createDevice(OTHER_SERVICE_ID, OTHER_DEVICE_ID, 'tado', {
      THERMOSTAT_MIN_TEMP: '-100',
      THERMOSTAT_MAX_TEMP: '200',
    });

    await migration.up();
    // Running it twice changes nothing more.
    await migration.up();

    expect(await paramsOf(MATTER_RANGE_DEVICE_ID)).to.deep.equal({ THERMOSTAT_TYPE: 'external' });
    expect(await paramsOf(USER_RANGE_DEVICE_ID)).to.deep.equal({
      THERMOSTAT_MIN_TEMP: '8',
      THERMOSTAT_MAX_TEMP: '25',
    });
    expect(await paramsOf(LONE_BOUND_DEVICE_ID)).to.deep.equal({
      THERMOSTAT_MIN_TEMP: '-100',
      THERMOSTAT_MAX_TEMP: '30',
    });
    expect(await paramsOf(OTHER_DEVICE_ID)).to.deep.equal({
      THERMOSTAT_MIN_TEMP: '-100',
      THERMOSTAT_MAX_TEMP: '200',
    });
  });

  it('should have nothing to undo', async () => {
    await migration.down();
  });
});
