const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const db = require('../../models');
const { enforceEnergyHierarchy, isElectricMeter } = require('../../utils/enforceEnergyHierarchy');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../utils/constants');

// a device of the seed, and a second one created by the tests
const DEVICE_ID = '7f85c2f8-86cc-4600-84db-6c074dadb4e8';
const SERVICE_ID = 'a810b8db-6d04-4697-bed3-c4b72c996279';

const createFeature = async (deviceId, externalId, type, extra = {}) => {
  const row = await db.DeviceFeature.create({
    device_id: deviceId,
    name: externalId,
    selector: externalId,
    external_id: externalId,
    category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
    type,
    read_only: true,
    has_feedback: false,
    min: 0,
    max: 100000,
    ...extra,
  });
  return row.get({ plain: true });
};

const createContract = (direction) =>
  db.EnergyContract.create({
    name: `Contract ${direction}`,
    electric_meter_device_id: DEVICE_ID,
    direction,
    valid_from: '2025-01-01',
    currency: 'EUR',
    timezone: 'Europe/Paris',
    tariff: { tariff_version: 1, components: [] },
  });

describe('enforceEnergyHierarchy (docs/specs/energy-hierarchy.md, C.1)', () => {
  let otherDeviceId;

  beforeEach(async () => {
    const other = await db.Device.create({
      service_id: SERVICE_ID,
      name: 'Other meter',
      selector: 'enforce-other-meter',
      external_id: 'enforce-other-meter',
    });
    otherDeviceId = other.id;
  });

  afterEach(async () => {
    sinon.restore();
    await db.EnergyContract.destroy({ where: {} });
  });

  it('should tell an electric meter: a device carrying a consumption contract', async () => {
    expect(await isElectricMeter(DEVICE_ID)).to.equal(false);
    await createContract('production');
    expect(await isElectricMeter(DEVICE_ID)).to.equal(false);
    await createContract('consumption');
    expect(await isElectricMeter(DEVICE_ID)).to.equal(true);
  });

  it('should do nothing on features without a parent', async () => {
    sinon.spy(db.EnergyContract, 'count');
    await enforceEnergyHierarchy(DEVICE_ID, [{ id: 'a', energy_parent_id: null }]);
    expect(db.EnergyContract.count.called).to.equal(false);
  });

  it('should keep a parent that disappeared', async () => {
    const features = [{ id: 'a', category: 'light', type: 'binary', energy_parent_id: 'unknown-feature' }];
    await enforceEnergyHierarchy(DEVICE_ID, features);
    expect(features[0].energy_parent_id).to.equal('unknown-feature');
  });

  it('should keep an electric meter a root, and the attachment of another device', async () => {
    const otherIndex = await createFeature(
      otherDeviceId,
      'enforce-other-index',
      DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
    );
    const index = await createFeature(DEVICE_ID, 'enforce-index', DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX, {
      energy_parent_id: otherIndex.id,
    });
    // not a meter: the attachment is kept
    await enforceEnergyHierarchy(DEVICE_ID, [index]);
    expect(index.energy_parent_id).to.equal(otherIndex.id);
    await createContract('consumption');
    await enforceEnergyHierarchy(DEVICE_ID, [index]);
    expect(index.energy_parent_id).to.equal(null);
    expect((await db.DeviceFeature.findByPk(index.id)).energy_parent_id).to.equal(null);
  });

  it('should cut a cycle on the link of the index', async () => {
    const index = await createFeature(DEVICE_ID, 'enforce-index', DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX);
    const consumption = await createFeature(
      DEVICE_ID,
      'enforce-index_consumption',
      DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
      { energy_parent_id: index.id },
    );
    await db.DeviceFeature.update({ energy_parent_id: consumption.id }, { where: { id: index.id } });
    index.energy_parent_id = consumption.id;
    await enforceEnergyHierarchy(DEVICE_ID, [consumption, index]);
    expect(index.energy_parent_id).to.equal(null);
    expect(consumption.energy_parent_id).to.equal(index.id);
    expect((await db.DeviceFeature.findByPk(index.id)).energy_parent_id).to.equal(null);
  });
});
