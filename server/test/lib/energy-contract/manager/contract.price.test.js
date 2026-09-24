const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const { buildManager, contractPayload, TEMPO_TARIFF, TEST_SERVICE_ID } = require('./helpers');
const { splitByBillingPeriod } = require('../../../../lib/energy-contract/contract.price');

const TEMPO = {
  key: 'tempo',
  granularity: 'day',
  timezone: 'Europe/Paris',
  day_starts_at: '06:00',
  values: ['blue', 'white', 'red'],
};
const DELEGATED_TARIFF = {
  tariff_version: 1,
  components: [{ key: 'subscription', kind: 'fixed', amount: 31, per: 'month' }],
};

describe('energyContract: priceContractIntervals', () => {
  let energyContract;
  beforeEach(async () => {
    ({ energyContract } = await buildManager());
  });

  it('should price intervals with the engine and the calendars stored in the database', async () => {
    await energyContract.declareCalendar(TEMPO, TEST_SERVICE_ID);
    await energyContract.publishCalendarEntries('tempo', [{ date: '2026-01-12', value: 'red' }], {
      provider_service_id: TEST_SERVICE_ID,
      skip_recalculation: true,
    });
    const contract = await energyContract.create(contractPayload({ name: 'Tempo', tariff: TEMPO_TARIFF }));
    const result = await energyContract.priceContractIntervals(contract, [
      { starts_at: '2026-01-12T22:00:00Z', kwh: 1 }, // 23:00 Paris, red off-peak
      { starts_at: '2026-01-12T11:00:00Z', kwh: 1 }, // 12:00 Paris, red peak (sorted first)
      { starts_at: '2026-01-13T11:00:00Z', kwh: 1 }, // no colour: fallback, no warning
    ]);
    expect(result.costs.map((c) => [c.starts_at, c.cost, c.label])).to.deep.equal([
      ['2026-01-12T11:00:00.000Z', 0.7562, 'Red peak'],
      ['2026-01-12T22:00:00.000Z', 0.1568, 'Red off-peak'],
      ['2026-01-13T11:00:00.000Z', 0.1296, 'Blue off-peak'],
    ]);
    expect(result.warnings).to.deep.equal([]);
    expect(result.unpriced).to.deep.equal([]);
    // the compiled tariff is cached per contract version
    const compiled = energyContract.getCompiledTariff(contract);
    expect(energyContract.getCompiledTariff(contract)).to.equal(compiled);
    const updated = await energyContract.update('tempo', { name: 'Tempo 2' });
    expect(energyContract.getCompiledTariff(updated)).to.not.equal(compiled);
    expect(await energyContract.priceContractIntervals(contract, [])).to.deep.equal({
      costs: [],
      warnings: [],
      cumulative: {},
      unpriced: [],
    });
  });

  it('should delegate the energy to the integration per billing period and add the fixed components', async () => {
    const contract = await energyContract.create(
      contractPayload({
        name: 'Agile',
        pricing_mode: 'delegated',
        provider_service_id: TEST_SERVICE_ID,
        tariff: DELEGATED_TARIFF,
        timezone: 'UTC',
        billing_period_start_day: 15,
      }),
    );
    const priceEnergyContract = sinon.fake(async (c, payload) => {
      const answers = new Map();
      payload.intervals.forEach((interval) => {
        answers.set(interval.starts_at, {
          cost: interval.kwh * 0.1,
          components: { energy: interval.kwh * 0.1 },
          label: 'agile',
        });
      });
      return answers;
    });
    energyContract.externalIntegration = { priceEnergyContract };
    const result = await energyContract.priceContractIntervals(contract, [
      { starts_at: '2026-01-14T23:30:00Z', kwh: 2 },
      { starts_at: '2026-01-15T00:00:00Z', kwh: 1, max_power_kw: 3 },
    ]);
    expect(priceEnergyContract.callCount).to.equal(2);
    const [, firstPayload] = priceEnergyContract.firstCall.args;
    expect(firstPayload.billing_period).to.deep.equal({
      starts_at: '2025-12-15T00:00:00.000Z',
      ends_at: '2026-01-15T00:00:00.000Z',
    });
    expect(firstPayload.intervals).to.deep.equal([{ starts_at: '2026-01-14T23:30:00.000Z', kwh: 2, max_power_kw: 4 }]);
    expect(firstPayload.cumulative_before).to.deep.equal({ day: 0, month: 0, billing_period: 0 });
    const [, secondPayload] = priceEnergyContract.secondCall.args;
    expect(secondPayload.intervals).to.deep.equal([{ starts_at: '2026-01-15T00:00:00.000Z', kwh: 1, max_power_kw: 3 }]);
    // the next period starts at local midnight: day and period restart, the month carries on
    expect(secondPayload.cumulative_before).to.deep.equal({ day: 0, month: 2, billing_period: 0 });
    expect(result.costs).to.have.lengthOf(2);
    // 31 per month spread over January (31 days * 48 intervals): 0.020833 per interval
    expect(result.costs[0].components).to.deep.equal({ subscription: 0.020833, energy: 0.2 });
    expect(result.costs[0].cost).to.equal(0.220833);
    expect(result.costs[0].label).to.equal('agile');
    expect(result.unpriced).to.deep.equal([]);
    // the cost job stores the energy only: the fixed components are left out on request
    const energyOnly = await energyContract.priceContractIntervals(
      contract,
      [{ starts_at: '2026-01-14T23:30:00Z', kwh: 2 }],
      { exclude_kinds: ['fixed'] },
    );
    expect(energyOnly.costs).to.deep.equal([
      { starts_at: '2026-01-14T23:30:00.000Z', cost: 0.2, components: { energy: 0.2 }, label: 'agile' },
    ]);
    // a caller's accumulation is handed to the first period, and a new month restarts it
    priceEnergyContract.resetHistory();
    await energyContract.priceContractIntervals(
      contract,
      [
        { starts_at: '2026-01-31T23:30:00Z', kwh: 2 },
        { starts_at: '2026-02-15T00:00:00Z', kwh: 1 },
      ],
      { cumulative_before: { day: 1, month: 10, billing_period: 5 } },
    );
    expect(priceEnergyContract.firstCall.args[1].cumulative_before).to.deep.equal({
      day: 1,
      month: 10,
      billing_period: 5,
    });
    expect(priceEnergyContract.secondCall.args[1].cumulative_before).to.deep.equal({
      day: 0,
      month: 0,
      billing_period: 0,
    });
  });

  it('should leave the intervals unpriced when the integration fails or answers partially', async () => {
    const contract = await energyContract.create(
      contractPayload({
        name: 'Agile',
        pricing_mode: 'delegated',
        provider_service_id: TEST_SERVICE_ID,
        tariff: DELEGATED_TARIFF,
        timezone: 'UTC',
      }),
    );
    energyContract.externalIntegration = {
      priceEnergyContract: sinon.fake.rejects(new Error('EXTERNAL_INTEGRATION_NOT_CONNECTED')),
    };
    const failed = await energyContract.priceContractIntervals(contract, [
      { starts_at: '2026-01-14T23:30:00Z', kwh: 2 },
      { starts_at: '2026-01-15T00:00:00Z', kwh: 1 },
    ]);
    expect(failed.costs).to.deep.equal([]);
    expect(failed.unpriced).to.deep.equal(['2026-01-14T23:30:00.000Z', '2026-01-15T00:00:00.000Z']);
    expect(failed.warnings[0]).to.include({
      reason: 'delegated_failed',
      message: 'EXTERNAL_INTEGRATION_NOT_CONNECTED',
    });
    energyContract.externalIntegration = {
      priceEnergyContract: sinon.fake.resolves(
        new Map([['2026-01-15T00:00:00.000Z', { cost: 0.5, components: { energy: 0.5 } }]]),
      ),
    };
    const partial = await energyContract.priceContractIntervals(contract, [
      { starts_at: '2026-01-14T23:30:00Z', kwh: 2 },
      { starts_at: '2026-01-15T00:00:00Z', kwh: 1 },
    ]);
    expect(partial.costs.map((c) => c.starts_at)).to.deep.equal(['2026-01-15T00:00:00.000Z']);
    expect(partial.unpriced).to.deep.equal(['2026-01-14T23:30:00.000Z']);
    // an empty answer is a failure too: nothing priced, nothing reported as unpriced twice
    energyContract.externalIntegration = { priceEnergyContract: sinon.fake.resolves(new Map()) };
    const empty = await energyContract.priceContractIntervals(contract, [
      { starts_at: '2026-01-15T00:00:00Z', kwh: 1 },
    ]);
    expect(empty.costs).to.deep.equal([]);
    expect(empty.unpriced).to.deep.equal([]);
  });

  it('should split intervals by billing period in the contract timezone', () => {
    const groups = splitByBillingPeriod({ timezone: 'Europe/Paris', billing_period_start_day: 1 }, [
      { starts_at: '2026-01-31T22:30:00Z' },
      { starts_at: '2026-01-31T23:00:00Z' },
      { starts_at: '2026-02-01T00:00:00Z' },
    ]);
    expect(groups.map((g) => [g.bounds.id, g.intervals.length])).to.deep.equal([
      ['2026-01-01', 1],
      ['2026-02-01', 2],
    ]);
  });
});
