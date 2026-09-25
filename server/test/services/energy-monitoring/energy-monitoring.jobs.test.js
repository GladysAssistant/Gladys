const sinon = require('sinon').createSandbox();
const { expect } = require('chai');
const db = require('../../../models');
const EnergyMonitoring = require('../../../services/energy-monitoring/lib');
const { EVENTS, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const {
  buildManager,
  contractPayload,
  insertConsumption,
  METER_DEVICE_ID,
  METER_COST_FEATURE_ID,
  TEST_SERVICE_ID,
} = require('../../lib/energy-contract/manager/helpers');

const { fake } = sinon;

describe('EnergyMonitoring: contract jobs', () => {
  let gladys;
  let energyContract;
  let device;
  let event;
  let energyMonitoring;
  beforeEach(async () => {
    ({ energyContract, device, event } = await buildManager({ timezone: 'UTC' }));
    gladys = {
      device,
      energyContract,
      event,
      variable: { getValue: fake.resolves('UTC') },
      scheduler: { scheduleJob: fake.returns({ name: 'job' }) },
      job: { updateProgress: fake.returns(null), wrapper: (name, func) => func },
    };
    energyMonitoring = new EnergyMonitoring(gladys, '43732e67-6669-4a95-83d6-38c50b835387');
    energyMonitoring.calculateCostFrom = fake.resolves(null);
  });
  afterEach(() => sinon.restore());

  it('should recalculate the costs of the meters on the recalculation event', async () => {
    await energyMonitoring.init();
    const payload = {
      from: '2026-01-12T00:00:00.000Z',
      electric_meter_device_ids: [METER_DEVICE_ID],
      calendar_key: 'tempo',
    };
    await energyMonitoring.recalculateForContracts(payload, 'job-1');
    expect(energyMonitoring.calculateCostFrom.callCount).to.equal(1);
    const [from, jobId, options] = energyMonitoring.calculateCostFrom.firstCall.args;
    expect(from.toISOString()).to.equal('2026-01-12T00:00:00.000Z');
    expect(jobId).to.equal('job-1');
    expect(options).to.deep.equal({ electricMeterDeviceIds: [METER_DEVICE_ID] });
    // the handler is registered on the event manager (through the job wrapper)
    const listeners = event.listeners(EVENTS.ENERGY_CONTRACT.RECALCULATE);
    expect(listeners).to.have.lengthOf(1);
    await listeners[0]({ from: new Date(), electric_meter_device_ids: [] });
    expect(energyMonitoring.calculateCostFrom.callCount).to.equal(2);
  });

  it('should schedule the billing period job and the catch-up in the 30-minute job', async () => {
    await energyMonitoring.init();
    expect(gladys.scheduler.scheduleJob.callCount).to.equal(4);
    const thirtyMinutes = gladys.scheduler.scheduleJob.firstCall.args[1];
    energyMonitoring.calculateConsumptionFromIndexThirtyMinutes = fake.resolves(null);
    energyMonitoring.calculateProductionFromIndexThirtyMinutes = fake.resolves(null);
    energyMonitoring.calculateCostEveryThirtyMinutes = fake.resolves(null);
    energyMonitoring.delegatedCatchUp = fake.resolves(null);
    energyContract.checkPriceChanges = fake.resolves([]);
    await thirtyMinutes();
    expect(energyMonitoring.delegatedCatchUp.callCount).to.equal(1);
    expect(energyContract.checkPriceChanges.callCount).to.equal(1);
    const [rule, closeJob] = gladys.scheduler.scheduleJob.secondCall.args;
    expect(rule.hour).to.equal(2);
    energyMonitoring.closeBillingPeriods = fake.resolves(null);
    await closeJob();
    expect(energyMonitoring.closeBillingPeriods.callCount).to.equal(1);
    // idempotent
    await energyMonitoring.init();
    expect(gladys.scheduler.scheduleJob.callCount).to.equal(4);
  });

  describe('closeBillingPeriods', () => {
    it('should reprice the period that just ended for the contracts with demand charges and purge the calendars', async () => {
      const demandTariff = {
        tariff_version: 1,
        components: [
          { key: 'e', kind: 'consumption', rules: [], fallback: { price: 0.1 } },
          { key: 'demand', kind: 'demand', price: 10, per: 'billing_period', aggregation: 'max' },
        ],
      };
      const today = new Date();
      // a billing period starting yesterday: the previous one just ended
      const startDay = ((today.getUTCDate() + 29) % 31) + 1;
      await energyContract.create(
        contractPayload({
          name: 'Demand',
          timezone: 'UTC',
          valid_from: '2020-01-01',
          tariff: demandTariff,
          billing_period_start_day: startDay,
        }),
      );
      await energyContract.create(
        contractPayload({ name: 'Flat', timezone: 'UTC', valid_from: '2019-01-01', valid_to: '2019-12-31' }),
      );
      const purge = sinon.stub(energyContract, 'purgeCalendarEntries').resolves(0);
      await insertConsumption([{ value: 1, created_at: new Date('2025-01-01T00:30:00.000Z') }]);
      // contract creations asked for recalculations through the event: reset the fake
      energyMonitoring.calculateCostFrom = fake.resolves(null);
      await energyMonitoring.closeBillingPeriods('job-2');
      expect(energyMonitoring.calculateCostFrom.callCount).to.equal(1);
      const [from, jobId, options] = energyMonitoring.calculateCostFrom.firstCall.args;
      expect(from.getTime()).to.be.below(Date.now() - 27 * 24 * 60 * 60 * 1000);
      expect(jobId).to.equal('job-2');
      expect(options).to.deep.equal({ electricMeterDeviceIds: [METER_DEVICE_ID] });
      // retention: the oldest state minus one day
      expect(purge.firstCall.args[0].toISOString()).to.equal('2024-12-31T00:30:00.000Z');
    });

    it('should do nothing without demand contracts and default the retention without states', async () => {
      await energyContract.create(contractPayload({ name: 'Flat', timezone: 'UTC', valid_from: '2020-01-01' }));
      const purge = sinon.stub(energyContract, 'purgeCalendarEntries').resolves(0);
      energyMonitoring.calculateCostFrom = fake.resolves(null);
      await energyMonitoring.closeBillingPeriods();
      expect(energyMonitoring.calculateCostFrom.callCount).to.equal(0);
      expect(purge.firstCall.args[0].getTime()).to.be.below(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000);
    });

    it('should not reprice a period that ended long ago', async () => {
      const today = new Date();
      // a billing period that started 10 days ago (or so): nothing to close
      const startDay = ((today.getUTCDate() + 20) % 28) + 1;
      await energyContract.create(
        contractPayload({
          name: 'Demand',
          timezone: 'UTC',
          valid_from: '2020-01-01',
          billing_period_start_day: startDay,
          tariff: {
            tariff_version: 1,
            components: [
              { key: 'e', kind: 'consumption', rules: [], fallback: { price: 0.1 } },
              { key: 'demand', kind: 'demand', price: 10, per: 'billing_period', aggregation: 'max' },
            ],
          },
        }),
      );
      sinon.stub(energyContract, 'purgeCalendarEntries').resolves(0);
      energyMonitoring.calculateCostFrom = fake.resolves(null);
      await energyMonitoring.closeBillingPeriods();
      expect(energyMonitoring.calculateCostFrom.callCount).to.equal(0);
    });
  });

  describe('delegatedCatchUp', () => {
    it('should recompute from the oldest 30-minute interval without a cost', async () => {
      await energyContract.create(
        contractPayload({
          name: 'Agile',
          pricing_mode: 'delegated',
          provider_service_id: TEST_SERVICE_ID,
          timezone: 'UTC',
          valid_from: '2020-01-01',
          tariff: { tariff_version: 1, components: [{ key: 's', kind: 'fixed', amount: 1, per: 'day' }] },
        }),
      );
      const now = Date.now();
      const hour = 60 * 60 * 1000;
      await insertConsumption([
        { value: 1, created_at: new Date(now - 40 * 24 * hour) }, // outside the 31-day window
        { value: 1, created_at: new Date(now - 3 * hour) },
        { value: 1, created_at: new Date(now - 2 * hour) },
        { value: 1, created_at: new Date(now - 1 * hour) },
      ]);
      await db.duckDbBatchInsertState(METER_COST_FEATURE_ID, [
        { value: 0.1, created_at: new Date(now - 3 * hour) },
        { value: 0.1, created_at: new Date(now - 1 * hour) },
      ]);
      energyMonitoring.calculateCostFrom = fake.resolves(null);
      await energyMonitoring.delegatedCatchUp('job-3');
      expect(energyMonitoring.calculateCostFrom.callCount).to.equal(1);
      const [from, jobId, options] = energyMonitoring.calculateCostFrom.firstCall.args;
      expect(from.getTime()).to.equal(new Date(now - 2 * hour).getTime() - 30 * 60 * 1000);
      expect(jobId).to.equal('job-3');
      expect(options).to.deep.equal({ electricMeterDeviceIds: [METER_DEVICE_ID] });
      // everything priced: nothing to do
      await db.duckDbBatchInsertState(METER_COST_FEATURE_ID, [{ value: 0.1, created_at: new Date(now - 2 * hour) }]);
      await energyMonitoring.delegatedCatchUp();
      expect(energyMonitoring.calculateCostFrom.callCount).to.equal(1);
    });

    it('should ignore rules contracts, orphaned contracts and devices of other meters', async () => {
      await energyContract.create(
        contractPayload({ name: 'Flat', timezone: 'UTC', valid_from: '2020-01-01', valid_to: '2021-01-01' }),
      );
      energyMonitoring.calculateCostFrom = fake.resolves(null);
      await energyMonitoring.delegatedCatchUp();
      expect(energyMonitoring.calculateCostFrom.callCount).to.equal(0);
      await energyContract.create(
        contractPayload({
          name: 'Orphan',
          pricing_mode: 'delegated',
          timezone: 'UTC',
          valid_from: '2022-01-01',
          tariff: { tariff_version: 1, components: [{ key: 's', kind: 'fixed', amount: 1, per: 'day' }] },
        }),
      );
      energyMonitoring.calculateCostFrom = fake.resolves(null);
      await energyMonitoring.delegatedCatchUp();
      expect(energyMonitoring.calculateCostFrom.callCount).to.equal(0);
      // an active delegated contract on another meter: the test meter's features are not scanned
      await device.create({
        id: 'e1fe2ab9-8c50-4053-ac40-83421f899c60',
        service_id: TEST_SERVICE_ID,
        name: 'Other meter',
        external_id: 'other-meter',
        features: [
          {
            id: '201d2306-b15e-4859-b403-a076167eadd9',
            external_id: 'other-consumption',
            selector: 'other-consumption',
            name: 'Consumption',
            read_only: true,
            has_feedback: false,
            min: 0,
            max: 1000,
            category: 'energy-sensor',
            type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          },
          {
            id: '2f4133be-b86c-4a97-9cc8-585fadb74006',
            external_id: 'other-cost',
            selector: 'other-cost',
            name: 'Cost',
            read_only: true,
            has_feedback: false,
            min: 0,
            max: 1000,
            category: 'energy-sensor',
            type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
            energy_parent_id: '201d2306-b15e-4859-b403-a076167eadd9',
          },
        ],
      });
      await energyContract.create(
        contractPayload({
          name: 'Other agile',
          electric_meter_device_id: 'e1fe2ab9-8c50-4053-ac40-83421f899c60',
          pricing_mode: 'delegated',
          provider_service_id: TEST_SERVICE_ID,
          timezone: 'UTC',
          valid_from: '2020-01-01',
          tariff: { tariff_version: 1, components: [{ key: 's', kind: 'fixed', amount: 1, per: 'day' }] },
        }),
      );
      await insertConsumption([{ value: 1, created_at: new Date(Date.now() - 60 * 60 * 1000) }]);
      energyMonitoring.calculateCostFrom = fake.resolves(null);
      await energyMonitoring.delegatedCatchUp();
      expect(energyMonitoring.calculateCostFrom.callCount).to.equal(0);
    });
  });
});
