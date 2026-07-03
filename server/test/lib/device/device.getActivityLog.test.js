const { expect } = require('chai');
const sinon = require('sinon');

const db = require('../../../models');
const { DEVICE_FEATURE_CATEGORIES } = require('../../../utils/constants');

const TEST_DEVICE_ID = '7f85c2f8-86cc-4600-84db-6c074dadb4e8';
const TEST_LIGHT_FEATURE_ID = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
const TEST_TEMPERATURE_FEATURE_ID = 'bb1af3b9-f87d-4d9c-b5be-958cd9d28900';
const CO2_FEATURE_ID = 'e2f4a6b1-9c3d-4e5f-a6b7-8c9d0e1f2a3b';

describe('Device.getActivityLog', function Describe() {
  this.timeout(15000);

  let clock;

  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
    clock = sinon.useFakeTimers({
      now: new Date('2026-07-03T12:00:00.000Z').getTime(),
    });
  });

  afterEach(async () => {
    clock.restore();
    await db.DeviceFeature.destroy({ where: { id: CO2_FEATURE_ID } });
  });

  const insertState = async (featureId, value, createdAt = new Date()) => {
    await db.duckDbInsertState(featureId, value, createdAt);
  };

  it('should return empty array when room selector does not exist', async () => {
    const entries = await global.TEST_GLADYS_INSTANCE.device.getActivityLog({
      room_selector: 'unknown-room-selector',
    });
    expect(entries).to.deep.equal([]);
  });

  it('should return activity log entries with device and room metadata', async () => {
    const createdAt = new Date('2026-07-03T11:30:00.000Z');
    await insertState(TEST_LIGHT_FEATURE_ID, 1, createdAt);

    const entries = await global.TEST_GLADYS_INSTANCE.device.getActivityLog({
      mode: 'all',
      take: 10,
      from: '2026-07-03T00:00:00.000Z',
      to: '2026-07-03T23:59:59.999Z',
    });

    const entry = entries.find((item) => item.device_feature_selector === 'test-device-feature');
    expect(entry).to.not.equal(undefined);
    expect(entry).to.include({
      value: 1,
      device_name: 'Test device',
      room_name: 'Test room',
      room_selector: 'test-room',
      device_feature_category: 'light',
      device_feature_type: 'binary',
    });
    expect(entry.service_name).to.be.a('string');
    expect(entry.created_at).to.not.equal(undefined);
  });

  it('should return CO2 sensor values with unit in mode all', async () => {
    await db.DeviceFeature.create({
      id: CO2_FEATURE_ID,
      name: 'CO2 sensor',
      selector: 'test-co2-sensor',
      external_id: 'test-co2-sensor-external',
      category: DEVICE_FEATURE_CATEGORIES.CO2_SENSOR,
      type: 'decimal',
      unit: 'ppm',
      read_only: true,
      keep_history: true,
      has_feedback: false,
      min: 0,
      max: 5000,
      device_id: TEST_DEVICE_ID,
    });

    await insertState(CO2_FEATURE_ID, 850, new Date('2026-07-03T11:00:00.000Z'));

    const entries = await global.TEST_GLADYS_INSTANCE.device.getActivityLog({
      mode: 'all',
      from: '2026-07-03T00:00:00.000Z',
      to: '2026-07-03T23:59:59.999Z',
    });

    const co2Entry = entries.find((item) => item.device_feature_selector === 'test-co2-sensor');
    expect(co2Entry).to.not.equal(undefined);
    expect(co2Entry).to.include({
      value: 850,
      device_feature_category: 'co2-sensor',
      device_feature_type: 'decimal',
      device_feature_unit: 'ppm',
    });
  });

  it('should exclude CO2 sensor in events mode', async () => {
    await db.DeviceFeature.create({
      id: CO2_FEATURE_ID,
      name: 'CO2 sensor',
      selector: 'test-co2-sensor',
      external_id: 'test-co2-sensor-external',
      category: DEVICE_FEATURE_CATEGORIES.CO2_SENSOR,
      type: 'decimal',
      unit: 'ppm',
      read_only: true,
      keep_history: true,
      has_feedback: false,
      min: 0,
      max: 5000,
      device_id: TEST_DEVICE_ID,
    });

    await insertState(CO2_FEATURE_ID, 850, new Date('2026-07-03T11:00:00.000Z'));
    await insertState(TEST_LIGHT_FEATURE_ID, 1, new Date('2026-07-03T11:05:00.000Z'));

    const entries = await global.TEST_GLADYS_INSTANCE.device.getActivityLog({
      mode: 'events',
      from: '2026-07-03T00:00:00.000Z',
      to: '2026-07-03T23:59:59.999Z',
    });

    expect(entries.find((item) => item.device_feature_selector === 'test-co2-sensor')).to.equal(undefined);
    expect(entries.find((item) => item.device_feature_selector === 'test-device-feature')).to.not.equal(undefined);
  });

  it('should filter by categories', async () => {
    await insertState(TEST_LIGHT_FEATURE_ID, 1, new Date('2026-07-03T11:00:00.000Z'));
    await insertState(TEST_TEMPERATURE_FEATURE_ID, 21.5, new Date('2026-07-03T11:05:00.000Z'));

    const entries = await global.TEST_GLADYS_INSTANCE.device.getActivityLog({
      categories: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
      from: '2026-07-03T00:00:00.000Z',
      to: '2026-07-03T23:59:59.999Z',
    });

    expect(entries.find((item) => item.device_feature_selector === 'test-temperature-sensor')).to.not.equal(undefined);
    expect(entries.find((item) => item.device_feature_selector === 'test-device-feature')).to.equal(undefined);
  });

  it('should filter by room selector', async () => {
    await insertState(TEST_LIGHT_FEATURE_ID, 1, new Date('2026-07-03T11:00:00.000Z'));

    const entries = await global.TEST_GLADYS_INSTANCE.device.getActivityLog({
      room_selector: 'test-room',
      from: '2026-07-03T00:00:00.000Z',
      to: '2026-07-03T23:59:59.999Z',
    });

    expect(entries.length).to.be.at.least(1);
    entries.forEach((entry) => {
      expect(entry.room_selector).to.equal('test-room');
    });
  });

  it('should respect take and skip pagination', async () => {
    await insertState(TEST_LIGHT_FEATURE_ID, 1, new Date('2026-07-03T11:00:00.000Z'));
    await insertState(TEST_LIGHT_FEATURE_ID, 0, new Date('2026-07-03T10:00:00.000Z'));
    await insertState(TEST_LIGHT_FEATURE_ID, 1, new Date('2026-07-03T09:00:00.000Z'));

    const firstPage = await global.TEST_GLADYS_INSTANCE.device.getActivityLog({
      mode: 'all',
      take: 2,
      skip: 0,
      from: '2026-07-03T00:00:00.000Z',
      to: '2026-07-03T23:59:59.999Z',
    });
    const secondPage = await global.TEST_GLADYS_INSTANCE.device.getActivityLog({
      mode: 'all',
      take: 2,
      skip: 2,
      from: '2026-07-03T00:00:00.000Z',
      to: '2026-07-03T23:59:59.999Z',
    });

    expect(firstPage).to.have.lengthOf(2);
    expect(secondPage).to.have.lengthOf(1);
    expect(firstPage[0].created_at.getTime()).to.be.greaterThan(secondPage[0].created_at.getTime());
  });

  it('should return empty array when features have keep_history disabled', async () => {
    await db.DeviceFeature.update({ keep_history: false }, { where: { id: TEST_LIGHT_FEATURE_ID } });
    await insertState(TEST_LIGHT_FEATURE_ID, 1, new Date('2026-07-03T11:00:00.000Z'));

    const entries = await global.TEST_GLADYS_INSTANCE.device.getActivityLog({
      categories: 'light',
      from: '2026-07-03T00:00:00.000Z',
      to: '2026-07-03T23:59:59.999Z',
    });

    expect(entries).to.deep.equal([]);

    await db.DeviceFeature.update({ keep_history: true }, { where: { id: TEST_LIGHT_FEATURE_ID } });
  });

  it('should return empty array when no feature matches filters', async () => {
    const entries = await global.TEST_GLADYS_INSTANCE.device.getActivityLog({
      categories: 'television',
      from: '2026-07-03T00:00:00.000Z',
      to: '2026-07-03T23:59:59.999Z',
    });

    expect(entries).to.deep.equal([]);
  });

  it('should handle devices without room metadata', async () => {
    const deviceWithoutRoomId = 'b1c2d3e4-f5a6-4789-b012-3456789abcde';
    const featureWithoutRoomId = 'c2d3e4f5-a6b7-4890-c123-456789abcde0';

    await db.Device.create({
      id: deviceWithoutRoomId,
      name: 'Device without room',
      selector: 'device-without-room',
      external_id: 'device-without-room-external',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      room_id: null,
    });

    await db.DeviceFeature.create({
      id: featureWithoutRoomId,
      name: 'Orphan sensor',
      selector: 'orphan-sensor',
      external_id: 'orphan-sensor-external',
      category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
      type: 'decimal',
      unit: 'celsius',
      read_only: true,
      keep_history: true,
      has_feedback: false,
      min: 0,
      max: 100,
      device_id: deviceWithoutRoomId,
    });

    await insertState(featureWithoutRoomId, 19.5, new Date('2026-07-03T11:15:00.000Z'));

    const entries = await global.TEST_GLADYS_INSTANCE.device.getActivityLog({
      mode: 'all',
      from: '2026-07-03T00:00:00.000Z',
      to: '2026-07-03T23:59:59.999Z',
    });

    const entry = entries.find((item) => item.device_feature_selector === 'orphan-sensor');
    expect(entry).to.not.equal(undefined);
    expect(entry.room_name).to.equal(null);
    expect(entry.room_selector).to.equal(null);
    expect(entry.device_feature_unit).to.equal('celsius');

    await db.DeviceFeature.destroy({ where: { id: featureWithoutRoomId } });
    await db.Device.destroy({ where: { id: deviceWithoutRoomId } });
  });

  it('should handle devices without service metadata', async () => {
    const featureId = 'd3e4f5a6-b7c8-4901-d234-567890abcdef';
    const createdAt = new Date('2026-07-03T11:20:00.000Z');
    await insertState(featureId, 1, createdAt);

    const findAllStub = sinon.stub(db.DeviceFeature, 'findAll').resolves([
      {
        id: featureId,
        get: () => ({
          id: featureId,
          selector: 'no-service-sensor',
          name: 'No service sensor',
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          type: 'binary',
          unit: null,
          device: {
            selector: 'no-service-device',
            name: 'No service device',
            room: null,
            service: null,
          },
        }),
      },
    ]);

    const entries = await global.TEST_GLADYS_INSTANCE.device.getActivityLog({
      mode: 'all',
      from: '2026-07-03T00:00:00.000Z',
      to: '2026-07-03T23:59:59.999Z',
    });

    expect(entries).to.have.lengthOf(1);
    expect(entries[0].service_name).to.equal(null);

    findAllStub.restore();
  });

  it('should use custom to date when provided', async () => {
    await insertState(TEST_LIGHT_FEATURE_ID, 1, new Date('2026-06-01T10:00:00.000Z'));

    const entries = await global.TEST_GLADYS_INSTANCE.device.getActivityLog({
      mode: 'all',
      from: '2026-06-01T00:00:00.000Z',
      to: '2026-06-01T23:59:59.999Z',
    });

    expect(entries.find((item) => item.device_feature_selector === 'test-device-feature')).to.not.equal(undefined);
  });

  it('should use default options when called without parameters', async () => {
    await insertState(TEST_LIGHT_FEATURE_ID, 1, new Date('2026-07-03T11:30:00.000Z'));

    const entries = await global.TEST_GLADYS_INSTANCE.device.getActivityLog();

    expect(entries.find((item) => item.device_feature_selector === 'test-device-feature')).to.not.equal(undefined);
  });

  it('should use default 24h window when from is not provided', async () => {
    await insertState(TEST_LIGHT_FEATURE_ID, 1, new Date('2026-07-03T11:30:00.000Z'));

    const entries = await global.TEST_GLADYS_INSTANCE.device.getActivityLog({
      mode: 'all',
      take: 5,
    });

    expect(entries.find((item) => item.device_feature_selector === 'test-device-feature')).to.not.equal(undefined);
  });
});
