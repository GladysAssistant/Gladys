const { expect, assert } = require('chai');
const sinon = require('sinon').createSandbox();
const db = require('../../../../models');
const logger = require('../../../../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, EVENTS } = require('../../../../utils/constants');
const {
  buildManager,
  addMeterPower,
  contractPayload,
  METER_DEVICE_ID,
  METER_FEATURE_ID,
  METER_CONSUMPTION_FEATURE_ID,
  METER_COST_FEATURE_ID,
  METER_POWER_FEATURE_ID,
  TEST_SERVICE_ID,
} = require('./helpers');

const PLUG_DEVICE_ID = '5c1f0f63-4b0e-4c0f-9d63-0d7e1b0f2a11';
const PLUG_INDEX_ID = '6a2e1f74-5c1f-4d10-8e74-1e8f2c1a3b22';
const PLUG_CONSUMPTION_ID = '7b3f2085-6d20-4e21-9f85-2f903d2b4c33';
const PLUG_COST_ID = '8c40319a-7e31-4f32-a096-30a14e3c5d44';

const energyFeature = (id, externalId, type, extra = {}) => ({
  id,
  external_id: externalId,
  selector: externalId,
  name: externalId,
  read_only: true,
  has_feedback: false,
  min: 0,
  max: 100000,
  category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
  type,
  ...extra,
});

/**
 * @description Save a smart plug carrying an index, its derived consumption and cost.
 * @param {object} device - The device manager.
 * @param {object} [overrides] - `index` / `consumption` / `cost` overrides.
 * @returns {Promise<object>} The saved device.
 * @example
 * await savePlug(device, { index: { energy_parent_id: METER_FEATURE_ID } });
 */
function savePlug(device, overrides = {}) {
  return device.create({
    id: PLUG_DEVICE_ID,
    service_id: TEST_SERVICE_ID,
    name: 'Washing machine plug',
    external_id: 'plug',
    selector: 'plug',
    features: [
      energyFeature(PLUG_INDEX_ID, 'plug-index', DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX, overrides.index),
      energyFeature(
        PLUG_CONSUMPTION_ID,
        'plug-index_consumption',
        DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
        { energy_parent_id: PLUG_INDEX_ID, ...overrides.consumption },
      ),
      energyFeature(
        PLUG_COST_ID,
        'plug-index_cost',
        DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
        {
          energy_parent_id: PLUG_CONSUMPTION_ID,
          ...overrides.cost,
        },
      ),
    ],
  });
}

const parentOf = async (id) => (await db.DeviceFeature.findByPk(id)).energy_parent_id;

/**
 * @description Save the test meter again, as a discovery would, with a parent on its index.
 * @param {object} device - The device manager.
 * @param {object} stateManager - The state manager.
 * @param {string} parentId - The parent sent for the meter index.
 * @returns {Promise<object>} The saved meter.
 * @example
 * await resaveMeter(device, stateManager, PLUG_INDEX_ID);
 */
function resaveMeter(device, stateManager, parentId) {
  const meter = stateManager.get('deviceById', METER_DEVICE_ID);
  return device.create({
    id: meter.id,
    service_id: meter.service_id,
    name: meter.name,
    external_id: meter.external_id,
    selector: meter.selector,
    features: meter.features.map(
      ({ id, external_id: externalId, selector, name, category, type, energy_parent_id: p }) => ({
        id,
        external_id: externalId,
        selector,
        name,
        category,
        type,
        read_only: true,
        has_feedback: false,
        min: 0,
        max: 100000,
        energy_parent_id: id === METER_FEATURE_ID ? parentId : p,
      }),
    ),
  });
}

describe('EnergyContract energy hierarchy (docs/specs/energy-hierarchy.md)', () => {
  let energyContract;
  let event;
  let device;
  let stateManager;
  let meter;

  beforeEach(async () => {
    ({ energyContract, event, device, stateManager, meter } = await buildManager());
    sinon.spy(event, 'emit');
  });

  afterEach(async () => {
    sinon.restore();
    await db.EnergyContract.destroy({ where: {} });
  });

  describe('device save (C.1)', () => {
    it('should cut a cycle on the link of the index', async () => {
      // the main meter fallback used to give an index its own derived consumption as parent
      await savePlug(device, { index: { energy_parent_id: PLUG_CONSUMPTION_ID } });
      expect(await parentOf(PLUG_INDEX_ID)).to.equal(null);
      expect(await parentOf(PLUG_CONSUMPTION_ID)).to.equal(PLUG_INDEX_ID);
      expect(await parentOf(PLUG_COST_ID)).to.equal(PLUG_CONSUMPTION_ID);
      expect(stateManager.get('deviceFeatureById', PLUG_INDEX_ID).energy_parent_id).to.equal(null);
    });

    it('should cut a cycle across two devices on the link of the saved device', async () => {
      await savePlug(device, { index: { energy_parent_id: METER_FEATURE_ID } });
      await resaveMeter(device, stateManager, PLUG_INDEX_ID);
      expect(await parentOf(METER_FEATURE_ID)).to.equal(null);
      expect(await parentOf(PLUG_INDEX_ID)).to.equal(METER_FEATURE_ID);
    });

    it('should keep an electric meter a root, and the attachment of another device', async () => {
      await energyContract.create(contractPayload());
      await savePlug(device, { index: { energy_parent_id: METER_FEATURE_ID } });
      const plug = stateManager.get('deviceById', PLUG_DEVICE_ID);
      expect(plug.features.find((f) => f.id === PLUG_INDEX_ID).energy_parent_id).to.equal(METER_FEATURE_ID);
      // a discovery falling back on another meter does not attach the meter
      await resaveMeter(device, stateManager, PLUG_INDEX_ID);
      expect(await parentOf(METER_FEATURE_ID)).to.equal(null);
      expect(await parentOf(METER_CONSUMPTION_FEATURE_ID)).to.equal(METER_FEATURE_ID);
    });
  });

  describe('root feature of a meter', () => {
    it('should return the index of the meter, never a derived feature', async () => {
      expect(energyContract.getMeterRootFeatureId(METER_DEVICE_ID)).to.equal(METER_FEATURE_ID);
      expect(energyContract.getMeterRootFeatureId('unknown')).to.equal(null);
      const plug = await device.create({
        service_id: TEST_SERVICE_ID,
        name: 'Thermometer',
        external_id: 'thermometer',
        selector: 'thermometer',
        features: [
          (({ id, ...f }) => ({ ...f, category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR }))(
            energyFeature(null, 'thermometer-temperature', 'decimal'),
          ),
        ],
      });
      expect(energyContract.getMeterRootFeatureId(plug.id)).to.equal(null);
    });

    it('should give the root feature of the meter of the most recent consumption contract', async () => {
      expect(await energyContract.getDefaultElectricMeterFeatureId()).to.equal(null);
      await savePlug(device);
      // a production contract never makes its meter the main meter (inserted directly: the API
      // only accepts consumption contracts yet)
      await db.EnergyContract.create({
        ...contractPayload({ name: 'Solar', electric_meter_device_id: PLUG_DEVICE_ID }),
        direction: 'production',
        timezone: 'Europe/Paris',
      });
      expect(await energyContract.getDefaultElectricMeterFeatureId()).to.equal(null);
      await energyContract.create(contractPayload());
      expect(await energyContract.getDefaultElectricMeterFeatureId()).to.equal(METER_FEATURE_ID);
      // a stale feature in RAM, deleted in the database
      sinon.stub(db.DeviceFeature, 'findByPk').resolves(null);
      expect(await energyContract.getDefaultElectricMeterFeatureId()).to.equal(null);
      sinon.restore();
      sinon.stub(energyContract, 'getMeterRootFeatureId').returns(null);
      expect(await energyContract.getDefaultElectricMeterFeatureId()).to.equal(null);
    });
  });

  describe('getDeviceElectricMeterId', () => {
    it('should walk up the attachment of a device to its root meter', async () => {
      await energyContract.create(contractPayload());
      await savePlug(device, { index: { energy_parent_id: METER_FEATURE_ID } });
      const plug = stateManager.get('deviceById', PLUG_DEVICE_ID);
      expect(await energyContract.getDeviceElectricMeterId(plug)).to.equal(METER_DEVICE_ID);
      // the meter is its own root
      expect(await energyContract.getDeviceElectricMeterId(stateManager.get('deviceById', METER_DEVICE_ID))).to.equal(
        METER_DEVICE_ID,
      );
    });

    it('should give an unattached device itself, and null on a broken hierarchy', async () => {
      await energyContract.create(contractPayload());
      await savePlug(device);
      const plug = stateManager.get('deviceById', PLUG_DEVICE_ID);
      // an unattached device is its own root: it is not on the meter
      expect(await energyContract.getDeviceElectricMeterId(plug)).to.equal(PLUG_DEVICE_ID);
      sinon.stub(device.energySensorManager, 'getRootElectricMeterDevice').returns(null);
      expect(await energyContract.getDeviceElectricMeterId(plug)).to.equal(null);
    });

    it('should put a device without energy source feature on the main meter', async () => {
      const battery = {
        id: 'battery',
        features: [{ id: 'level', category: DEVICE_FEATURE_CATEGORIES.BATTERY, type: 'integer' }],
      };
      expect(await energyContract.getDeviceElectricMeterId(battery)).to.equal(null);
      await energyContract.create(contractPayload());
      await savePlug(device);
      // a production contract created later never makes its meter the main meter
      await db.EnergyContract.create({
        ...contractPayload({ name: 'Solar', electric_meter_device_id: PLUG_DEVICE_ID }),
        direction: 'production',
        timezone: 'Europe/Paris',
      });
      expect(await energyContract.getDeviceElectricMeterId(battery)).to.equal(METER_DEVICE_ID);
      expect(await energyContract.getDeviceElectricMeterId({ id: 'no-features' })).to.equal(METER_DEVICE_ID);
    });
  });

  describe('contracts (C.2)', () => {
    it('should make the meter of a new or updated consumption contract a root', async () => {
      await savePlug(device);
      await db.DeviceFeature.update({ energy_parent_id: PLUG_INDEX_ID }, { where: { id: METER_FEATURE_ID } });
      await device.init(false);
      const created = await energyContract.create(contractPayload());
      expect(await parentOf(METER_FEATURE_ID)).to.equal(null);
      await db.DeviceFeature.update({ energy_parent_id: PLUG_INDEX_ID }, { where: { id: METER_FEATURE_ID } });
      await device.init(false);
      await energyContract.update(created.selector, { name: 'Renamed' });
      expect(await parentOf(METER_FEATURE_ID)).to.equal(null);
      expect(await parentOf(METER_CONSUMPTION_FEATURE_ID)).to.equal(METER_FEATURE_ID);
    });

    it('should leave the meter of a production contract attached', async () => {
      await savePlug(device);
      await db.DeviceFeature.update({ energy_parent_id: PLUG_INDEX_ID }, { where: { id: METER_FEATURE_ID } });
      await device.init(false);
      const created = await db.EnergyContract.create({
        ...contractPayload({ name: 'Solar' }),
        direction: 'production',
        timezone: 'Europe/Paris',
      });
      await energyContract.detachElectricMeter(created);
      await energyContract.update(created.selector, { name: 'Solar panels' });
      expect(await parentOf(METER_FEATURE_ID)).to.equal(PLUG_INDEX_ID);
      await energyContract.detachElectricMeter({ direction: 'consumption', electric_meter_device_id: 'unknown' });
    });

    it('should recompute the former and the new meter when a contract changes meter', async () => {
      await savePlug(device, { index: { energy_parent_id: METER_FEATURE_ID } });
      const created = await energyContract.create(contractPayload());
      event.emit.resetHistory();
      await energyContract.update(created.selector, { electric_meter_device_id: PLUG_DEVICE_ID });
      // the plug is the meter of the contract now: a root
      expect(await parentOf(PLUG_INDEX_ID)).to.equal(null);
      const [name, payload] = event.emit.firstCall.args;
      expect(name).to.equal(EVENTS.ENERGY_CONTRACT.RECALCULATE);
      expect(payload.electric_meter_device_ids).to.deep.equal([METER_DEVICE_ID, PLUG_DEVICE_ID]);
    });

    it('should write no contract when its meter cannot be detached', async () => {
      sinon.stub(energyContract, 'detachElectricMeter').rejects(new Error('stale feature'));
      await assert.isRejected(energyContract.create(contractPayload()), 'stale feature');
      expect(await db.EnergyContract.count()).to.equal(0);
    });
  });

  describe('setDeviceElectricMeter (D.1)', () => {
    it('should attach every attachment feature of a device and recompute its costs', async () => {
      await savePlug(device);
      await energyContract.create(contractPayload({ valid_from: '2025-03-01' }));
      await energyContract.create(contractPayload({ name: 'Older', valid_from: '2024-01-01', valid_to: '2025-02-28' }));
      event.emit.resetHistory();
      const updated = await energyContract.setDeviceElectricMeter('plug', METER_DEVICE_ID);
      expect(updated.features.find((f) => f.id === PLUG_INDEX_ID).energy_parent_id).to.equal(METER_FEATURE_ID);
      expect(await parentOf(PLUG_INDEX_ID)).to.equal(METER_FEATURE_ID);
      // the derived links are untouched
      expect(await parentOf(PLUG_CONSUMPTION_ID)).to.equal(PLUG_INDEX_ID);
      expect(event.emit.calledOnce).to.equal(true);
      const [name, payload] = event.emit.firstCall.args;
      expect(name).to.equal(EVENTS.ENERGY_CONTRACT.RECALCULATE);
      expect(payload).to.deep.equal({
        // the earliest contract of the meter, at its local midnight (Europe/Paris)
        from: new Date('2023-12-31T23:00:00.000Z'),
        electric_meter_device_ids: [METER_DEVICE_ID],
        device_ids: [PLUG_DEVICE_ID],
      });
      // already attached: nothing to recompute
      event.emit.resetHistory();
      await energyContract.setDeviceElectricMeter('plug', METER_DEVICE_ID);
      expect(event.emit.called).to.equal(false);
    });

    it('should recompute the devices hanging under a moved sub-meter', async () => {
      await savePlug(device);
      // a lamp attached under the plug (a sub-meter)
      const lamp = await device.create({
        service_id: TEST_SERVICE_ID,
        name: 'Lamp',
        external_id: 'lamp',
        selector: 'lamp',
        features: [
          (({ id, ...f }) => f)(
            energyFeature(null, 'lamp-index', DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX, {
              energy_parent_id: PLUG_INDEX_ID,
            }),
          ),
        ],
      });
      // devices whose parents lead nowhere, or loop among themselves, are not under the plug
      const indexOf = (id, parentId, deviceId) => ({
        id,
        device_id: deviceId,
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
        energy_parent_id: parentId,
      });
      const ghost = indexOf('ghost-index', 'missing-feature', 'ghost');
      const loopA = indexOf('loop-a-index', 'loop-b-index', 'loop-a');
      const loopB = indexOf('loop-b-index', 'loop-a-index', 'loop-b');
      stateManager.setState('deviceById', 'ghost', { id: 'ghost', features: [ghost] });
      stateManager.setState('deviceById', 'loop-a', { id: 'loop-a', features: [loopA] });
      stateManager.setState('deviceFeatureById', 'loop-a-index', loopA);
      stateManager.setState('deviceFeatureById', 'loop-b-index', loopB);
      await energyContract.create(contractPayload());
      event.emit.resetHistory();
      await energyContract.setDeviceElectricMeter('plug', METER_DEVICE_ID);
      const [, payload] = event.emit.firstCall.args;
      expect(payload.device_ids).to.deep.equal([PLUG_DEVICE_ID, lamp.id]);
    });

    it('should refuse what is not the attachment of a device to an electric meter', async () => {
      await savePlug(device);
      await assert.isRejected(energyContract.setDeviceElectricMeter('unknown', METER_DEVICE_ID), 'DEVICE_NOT_FOUND');
      await assert.isRejected(
        energyContract.setDeviceElectricMeter('plug', 'unknown'),
        'ELECTRIC_METER_DEVICE_NOT_FOUND',
      );
      await assert.isRejected(energyContract.setDeviceElectricMeter('plug', null), 'ELECTRIC_METER_DEVICE_NOT_FOUND');
      await assert.isRejected(
        energyContract.setDeviceElectricMeter('plug', PLUG_DEVICE_ID),
        'ELECTRIC_METER_IS_THE_DEVICE',
      );
      await assert.isRejected(
        energyContract.setDeviceElectricMeter('plug', METER_DEVICE_ID),
        'ELECTRIC_METER_HAS_NO_CONTRACT',
      );
      await energyContract.create(contractPayload());
      await energyContract.create(contractPayload({ name: 'Plug contract', electric_meter_device_id: PLUG_DEVICE_ID }));
      await assert.isRejected(
        energyContract.setDeviceElectricMeter('plug', METER_DEVICE_ID),
        'DEVICE_IS_AN_ELECTRIC_METER',
      );
      await assert.isRejected(
        energyContract.setDeviceElectricMeter('electrical-meter', PLUG_DEVICE_ID),
        'DEVICE_IS_AN_ELECTRIC_METER',
      );
      await db.EnergyContract.destroy({ where: { electric_meter_device_id: PLUG_DEVICE_ID } });
      const thermometer = await device.create({
        service_id: TEST_SERVICE_ID,
        name: 'Thermometer',
        external_id: 'thermometer',
        selector: 'thermometer',
        features: [
          (({ id, ...f }) => ({ ...f, category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR }))(
            energyFeature(null, 'thermometer-temperature', 'decimal'),
          ),
        ],
      });
      await assert.isRejected(
        energyContract.setDeviceElectricMeter('thermometer', METER_DEVICE_ID),
        'DEVICE_HAS_NO_ENERGY_FEATURE',
      );
      await energyContract.create(
        contractPayload({ name: 'Thermometer contract', electric_meter_device_id: thermometer.id }),
      );
      await assert.isRejected(
        energyContract.setDeviceElectricMeter('plug', thermometer.id),
        'ELECTRIC_METER_HAS_NO_ENERGY_FEATURE',
      );
    });
  });

  describe('repairHierarchy (C.3)', () => {
    it('should write nothing on a sound hierarchy', async () => {
      await savePlug(device, { index: { energy_parent_id: METER_FEATURE_ID } });
      sinon.spy(db.DeviceFeature, 'update');
      expect(await energyContract.repairHierarchy()).to.equal(0);
      expect(db.DeviceFeature.update.called).to.equal(false);
    });

    it('should cut the cycles and make the electric meters roots', async () => {
      await savePlug(device);
      await energyContract.create(contractPayload());
      // a Lixee-like cycle on the plug, the meter attached under a light
      await db.DeviceFeature.update({ energy_parent_id: PLUG_CONSUMPTION_ID }, { where: { id: PLUG_INDEX_ID } });
      const light = await db.DeviceFeature.findOne({ where: { selector: 'test-device-feature' } });
      await db.DeviceFeature.update({ energy_parent_id: light.id }, { where: { id: METER_FEATURE_ID } });
      // a parent outside the energy features is walked through without a cycle
      await db.DeviceFeature.update({ energy_parent_id: light.id }, { where: { id: PLUG_COST_ID } });
      await device.init(false);
      expect(await energyContract.repairHierarchy()).to.equal(2);
      expect(await parentOf(PLUG_INDEX_ID)).to.equal(null);
      expect(await parentOf(PLUG_CONSUMPTION_ID)).to.equal(PLUG_INDEX_ID);
      expect(await parentOf(METER_FEATURE_ID)).to.equal(null);
      expect(stateManager.get('deviceFeatureById', PLUG_INDEX_ID).energy_parent_id).to.equal(null);
    });

    it('should cut the link of the meter in a cycle with a plug of the same rank', async () => {
      await savePlug(device);
      await energyContract.create(contractPayload());
      // the plug comes first: cutting the cycles first would have detached it
      await db.DeviceFeature.update({ energy_parent_id: METER_FEATURE_ID }, { where: { id: PLUG_INDEX_ID } });
      await db.DeviceFeature.update({ energy_parent_id: PLUG_INDEX_ID }, { where: { id: METER_FEATURE_ID } });
      expect(await energyContract.repairHierarchy()).to.equal(1);
      expect(await parentOf(METER_FEATURE_ID)).to.equal(null);
      expect(await parentOf(PLUG_INDEX_ID)).to.equal(METER_FEATURE_ID);
    });

    it('should give a root to a meter whose features all hang off one another', async () => {
      await addMeterPower(device, meter, []);
      await energyContract.create(contractPayload());
      // the index under the power feature of its own device: no cycle, but no root either
      await db.DeviceFeature.update({ energy_parent_id: METER_POWER_FEATURE_ID }, { where: { id: METER_FEATURE_ID } });
      // a meter with no energy feature at all has nothing to repair
      const thermometer = await device.create({
        service_id: TEST_SERVICE_ID,
        name: 'Thermometer',
        external_id: 'thermometer',
        selector: 'thermometer',
        features: [
          (({ id, ...f }) => ({ ...f, category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR }))(
            energyFeature(null, 'thermometer-temperature', 'decimal'),
          ),
        ],
      });
      await db.EnergyContract.create({
        ...contractPayload({ name: 'Thermometer contract', electric_meter_device_id: thermometer.id }),
        direction: 'consumption',
        timezone: 'Europe/Paris',
      });
      expect(await energyContract.repairHierarchy()).to.equal(1);
      expect(await parentOf(METER_FEATURE_ID)).to.equal(null);
      expect(await parentOf(METER_CONSUMPTION_FEATURE_ID)).to.equal(METER_FEATURE_ID);
    });

    it('should make a meter attached under another energy device a root', async () => {
      await savePlug(device);
      await energyContract.create(contractPayload());
      await db.DeviceFeature.update({ energy_parent_id: PLUG_INDEX_ID }, { where: { id: METER_FEATURE_ID } });
      expect(await energyContract.repairHierarchy()).to.equal(1);
      expect(await parentOf(METER_FEATURE_ID)).to.equal(null);
    });

    it('should restore the derived links the former "Fix" button removed', async () => {
      await savePlug(device);
      await db.DeviceFeature.update(
        { energy_parent_id: null },
        { where: { id: [PLUG_CONSUMPTION_ID, PLUG_COST_ID, METER_CONSUMPTION_FEATURE_ID, METER_COST_FEATURE_ID] } },
      );
      // the cost of the meter is not named after its consumption: the only consumption of its duration
      expect(await energyContract.repairHierarchy()).to.equal(3);
      expect(await parentOf(PLUG_CONSUMPTION_ID)).to.equal(PLUG_INDEX_ID);
      expect(await parentOf(PLUG_COST_ID)).to.equal(PLUG_CONSUMPTION_ID);
      expect(await parentOf(METER_COST_FEATURE_ID)).to.equal(METER_CONSUMPTION_FEATURE_ID);
      // the meter consumption is not named after its index: left as is
      expect(await parentOf(METER_CONSUMPTION_FEATURE_ID)).to.equal(null);
    });

    it('should restore the cost of a consumption fed by an integration, by name', async () => {
      const supplier = await device.create({
        service_id: TEST_SERVICE_ID,
        name: 'Supplier meter',
        external_id: 'supplier',
        selector: 'supplier',
        features: [
          ['supplier-daily', DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION],
          ['supplier-other', DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION],
          ['supplier-daily_cost', DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION_COST],
          ['supplier-unnamed', DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION_COST],
          // named like a derived consumption, without its index: left as is
          ['supplier-orphan_consumption', DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION],
        ].map(([externalId, type]) => {
          const { id, ...f } = energyFeature(null, externalId, type);
          return f;
        }),
      });
      const byExternalId = (externalId) => supplier.features.find((f) => f.external_id === externalId);
      expect(await energyContract.repairHierarchy()).to.equal(1);
      expect(await parentOf(byExternalId('supplier-daily_cost').id)).to.equal(byExternalId('supplier-daily').id);
      // two consumptions of the same duration and no name: left as is
      expect(await parentOf(byExternalId('supplier-unnamed').id)).to.equal(null);
      expect(await parentOf(byExternalId('supplier-orphan_consumption').id)).to.equal(null);
    });

    it('should not restore a link that would close a cycle', async () => {
      await savePlug(device);
      await db.DeviceFeature.update({ energy_parent_id: null }, { where: { id: PLUG_COST_ID } });
      await db.DeviceFeature.update({ energy_parent_id: PLUG_COST_ID }, { where: { id: PLUG_CONSUMPTION_ID } });
      expect(await energyContract.repairHierarchy()).to.equal(0);
      expect(await parentOf(PLUG_COST_ID)).to.equal(null);
    });

    it('should never block the start-up', async () => {
      sinon.stub(energyContract, 'migrateFromEnergyPrice').resolves();
      sinon.stub(energyContract, 'repairHierarchy').rejects(new Error('database locked'));
      sinon.spy(logger, 'error');
      await energyContract.init();
      expect(logger.error.calledWithMatch('Energy hierarchy repair failed')).to.equal(true);
    });
  });
});
