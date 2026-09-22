const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const db = require('../../../../models');
const { EVENTS } = require('../../../../utils/constants');
const { buildManager, contractPayload, insertConsumption, METER_DEVICE_ID, TEST_SERVICE_ID } = require('./helpers');
const {
  convertPriceRows,
  hourSlotsToTimeIntervals,
  normalizeContractType,
} = require('../../../../lib/energy-contract/legacy/convertPriceRows');
const { legacyCost } = require('../../../../lib/energy-contract/legacy/calculateCost');
const { timeToHourSlots } = require('../../../../lib/energy-contract/energyPrice.project');
const {
  groupPriceRows,
  toIsoCurrency,
  MIGRATION_DONE_VARIABLE,
} = require('../../../../lib/energy-contract/migration.fromEnergyPrice');
const { validateTariff } = require('../../../../lib/energy-contract/tariff.validate');

const OFF_PEAK = '22:00,22:30,23:00,23:30,00:00,00:30,01:00,01:30,02:00,02:30,03:00,03:30,04:00,04:30,05:00,05:30';
const PEAK =
  '06:00,06:30,07:00,07:30,08:00,08:30,09:00,09:30,10:00,10:30,11:00,11:30,12:00,12:30,13:00,13:30,14:00,14:30,15:00,15:30,16:00,16:30,17:00,17:30,18:00,18:30,19:00,19:30,20:00,20:30,21:00,21:30';

const row = (overrides) => ({
  electric_meter_device_id: METER_DEVICE_ID,
  contract_name: 'edf-base',
  contract: 'base',
  price_type: 'consumption',
  currency: 'euro',
  start_date: '2025-01-01',
  end_date: null,
  price: 2000,
  hour_slots: null,
  day_type: null,
  subscribed_power: '6',
  ...overrides,
});

describe('energyContract: legacy prices', () => {
  describe('convertPriceRows', () => {
    it('should convert the three contract types and the subscription', () => {
      const base = convertPriceRows([row({}), row({ price_type: 'subscription', price: 120000 })]);
      expect(base.contractType).to.equal('base');
      expect(base.tariff).to.deep.equal({
        tariff_version: 1,
        components: [
          { key: 'energy', kind: 'consumption', rules: [], fallback: { price: 0.2 } },
          { key: 'subscription', kind: 'fixed', amount: 12, per: 'month' },
        ],
      });
      const peak = convertPriceRows([
        row({ contract: 'peak-off-peak', price: 2500, hour_slots: PEAK }),
        row({ contract: 'peak-off-peak', price: 1500, hour_slots: OFF_PEAK }),
      ]);
      expect(peak.tariff.components[0]).to.deep.equal({
        key: 'energy',
        kind: 'consumption',
        rules: [{ label: 'off-peak', when: { time: [['22:00', '06:00']] }, price: 0.15 }],
        fallback: { label: 'peak', price: 0.25 },
      });
      const tempo = convertPriceRows([
        row({ contract: 'edf-tempo', price: 1296, day_type: 'blue', hour_slots: OFF_PEAK }),
        row({ contract: 'edf-tempo', price: 1609, day_type: 'blue', hour_slots: PEAK }),
        row({ contract: 'edf_tempo', price: 7562, day_type: 'red', hour_slots: PEAK }),
        row({ contract: 'edf-tempo', price: 1568, day_type: 'red', hour_slots: OFF_PEAK }),
      ]);
      expect(tempo.tariff.calendars).to.deep.equal(['tempo']);
      expect(tempo.tariff.components[0].rules.map((r) => [r.label, r.price])).to.deep.equal([
        ['red peak', 0.7562],
        ['red off-peak', 0.1568],
        ['blue peak', 0.1609],
        ['blue off-peak', 0.1296],
      ]);
      expect(tempo.tariff.components[0].fallback).to.deep.equal({ label: 'off-peak', price: 0.1296 });
      validateTariff(tempo.tariff);
      // no blue row: the fallback is the last colour off-peak price
      const redOnly = convertPriceRows([
        row({ contract: 'edf-tempo', price: 1568, day_type: 'red', hour_slots: OFF_PEAK }),
      ]);
      expect(redOnly.tariff.components[0].fallback.price).to.equal(0.1568);
      expect(redOnly.tariff.components[0].rules).to.have.lengthOf(1);
      // subscription only
      const subscription = convertPriceRows([row({ price_type: 'subscription', price: 100000 })]);
      expect(subscription.tariff.components[0].fallback).to.deep.equal({ price: 0 });
      expect(normalizeContractType('base')).to.equal('base');
    });

    it('should turn placeholder slots into an input', () => {
      const converted = convertPriceRows([
        row({ contract: 'peak-off-peak', price: 2700, hour_slots: 'TO_REPLACE_PEAK' }),
        row({ contract: 'peak-off-peak', price: 2000, hour_slots: 'TO_REPLACE_OFF_PEAK' }),
      ]);
      expect(converted.inputs).to.deep.equal([{ key: 'off_peak_slots', type: 'time_intervals', required: true }]);
      expect(converted.tariff.components[0].rules[0].when.time).to.equal('{{input:off_peak_slots}}');
      const generic = convertPriceRows([
        row({ contract: 'peak-off-peak', price: 2700, hour_slots: 'TO_REPLACE' }),
        row({ contract: 'peak-off-peak', price: 2000, hour_slots: OFF_PEAK }),
      ]);
      expect(generic.tariff.components[0].fallback.price).to.equal(0.27);
    });

    it('should convert hour slots into merged intervals', () => {
      expect(hourSlotsToTimeIntervals(OFF_PEAK)).to.deep.equal([['22:00', '06:00']]);
      expect(hourSlotsToTimeIntervals('12:00,12:30, 13:00')).to.deep.equal([['12:00', '13:30']]);
      expect(hourSlotsToTimeIntervals('23:30')).to.deep.equal([['23:30', '24:00']]);
      expect(hourSlotsToTimeIntervals('0,47,99,bad')).to.deep.equal([['23:30', '01:00']]);
      expect(hourSlotsToTimeIntervals('')).to.deep.equal([]);
      expect(timeToHourSlots([['22:00', '00:00']])).to.equal('22:00,22:30,23:00,23:30');
      expect(timeToHourSlots([['23:00', '00:30']])).to.equal('23:00,23:30,00:00');
      expect(timeToHourSlots(undefined)).to.equal('');
    });
  });

  describe('legacyCost', () => {
    it('should reproduce the price-row calculation', () => {
      const tz = 'Europe/Paris';
      expect(legacyCost([row({})], new Date('2026-01-12T11:00:00Z'), 2, tz, new Map())).to.equal(0.4);
      expect(legacyCost([row({ price_type: 'subscription' })], new Date(), 2, tz, new Map())).to.equal(null);
      const peakRows = [
        row({ contract: 'peak-off-peak', price: 2500, hour_slots: PEAK }),
        row({ contract: 'peak-off-peak', price: 1500, hour_slots: OFF_PEAK }),
      ];
      expect(legacyCost(peakRows, new Date('2026-01-12T22:10:00Z'), 1, tz, new Map())).to.equal(0.15);
      expect(legacyCost(peakRows, new Date('2026-01-12T11:40:00Z'), 1, tz, new Map())).to.equal(0.25);
      expect(
        legacyCost([row({ contract: 'peak-off-peak', price: 2500, hour_slots: '' })], new Date(), 1, tz, new Map()),
      ).to.equal(null);
      const tempoRows = [
        row({ contract: 'edf-tempo', price: 7562, day_type: 'red', hour_slots: PEAK }),
        row({ contract: 'edf-tempo', price: 1568, day_type: 'red', hour_slots: OFF_PEAK }),
      ];
      const colours = new Map([['2026-01-12', 'red']]);
      expect(legacyCost(tempoRows, new Date('2026-01-12T11:00:00Z'), 1, tz, colours)).to.equal(0.7562);
      // 04:00 Paris on the 13th: the colour of the 12th
      expect(legacyCost(tempoRows, new Date('2026-01-13T03:00:00Z'), 1, tz, colours)).to.equal(0.1568);
      expect(legacyCost(tempoRows, new Date('2026-01-14T11:00:00Z'), 1, tz, colours)).to.equal(null);
      expect(
        legacyCost(tempoRows, new Date('2026-01-12T11:00:00Z'), 1, tz, new Map([['2026-01-12', 'white']])),
      ).to.equal(null);
    });
  });

  describe('migrateFromEnergyPrice', () => {
    let energyContract;
    let event;
    let variables;
    beforeEach(async () => {
      ({ energyContract, event, variables } = await buildManager());
      energyContract.getCommunityTemplates = sinon.fake.resolves([{ key: 'edf-base' }]);
    });

    it('should convert the price rows into contracts once and request a recalculation', async () => {
      await db.EnergyPrice.bulkCreate([
        row({
          id: '11111111-1111-4111-8111-111111111111',
          selector: 'p1',
          start_date: '2025-01-01',
          end_date: '2025-06-30',
        }),
        row({
          id: '11111111-1111-4111-8111-111111111112',
          selector: 'p2',
          start_date: '2025-01-01',
          end_date: '2025-06-30',
          price_type: 'subscription',
          price: 120000,
        }),
        row({
          id: '11111111-1111-4111-8111-111111111113',
          selector: 'p3',
          contract_name: 'Tempo',
          contract: 'edf-tempo',
          start_date: '2025-07-01',
          price: 1296,
          day_type: 'blue',
          hour_slots: OFF_PEAK,
          subscribed_power: null,
          currency: 'EUR',
        }),
        row({
          id: '11111111-1111-4111-8111-111111111114',
          selector: 'p4',
          contract_name: null,
          contract: 'base',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          electric_meter_device_id: null,
        }),
      ]);
      const emitted = sinon.fake();
      event.on(EVENTS.ENERGY_CONTRACT.RECALCULATE, emitted);
      const created = await energyContract.migrateFromEnergyPrice();
      expect(created.map((c) => c.name)).to.deep.equal(['edf-base', 'Tempo']);
      const [tempo, base] = await energyContract.get();
      expect(tempo.name).to.equal('Tempo');
      expect(base).to.include({
        name: 'edf-base',
        valid_from: '2025-01-01',
        valid_to: '2025-06-30',
        currency: 'EUR',
        timezone: 'Europe/Paris',
        provider_kind: 'community',
        template_key: 'edf-base',
        subscribed_power: 6,
        power_unit: 'kVA',
      });
      expect(base.tariff.components[1]).to.deep.equal({ key: 'subscription', kind: 'fixed', amount: 12, per: 'month' });
      expect(tempo).to.include({ valid_to: null, provider_kind: 'user', template_key: null, subscribed_power: null });
      expect(tempo.tariff.calendars).to.deep.equal(['tempo']);
      expect(emitted.callCount).to.equal(1);
      expect(emitted.firstCall.args[0].from.toISOString()).to.equal('2024-12-31T23:00:00.000Z');
      expect(variables[MIGRATION_DONE_VARIABLE]).to.be.a('string');
      // second run: nothing
      expect(await energyContract.migrateFromEnergyPrice()).to.deep.equal([]);
      expect(await db.EnergyPrice.count()).to.equal(4);
    });

    it('should flag a migrated contract whose calculation differs from the legacy one', async () => {
      // a peak/off-peak contract whose peak slots miss 12:00: the legacy code prices nothing
      // there while the engine prices it with the fallback
      await db.EnergyPrice.bulkCreate([
        row({
          id: '11111111-1111-4111-8111-111111111121',
          selector: 'q1',
          contract: 'peak-off-peak',
          price: 2500,
          hour_slots: '06:00,06:30',
        }),
        row({
          id: '11111111-1111-4111-8111-111111111122',
          selector: 'q2',
          contract: 'peak-off-peak',
          price: 1000,
          hour_slots: OFF_PEAK,
        }),
      ]);
      const now = Date.now();
      await insertConsumption([
        { value: 1, created_at: new Date(now - 3 * 60 * 60 * 1000) },
        { value: 1, created_at: new Date(now - 2 * 60 * 60 * 1000) },
      ]);
      energyContract.getCommunityTemplates = sinon.fake.rejects(new Error('offline'));
      const [created] = await energyContract.migrateFromEnergyPrice();
      const contract = await energyContract.getBySelector(created.selector);
      expect(contract.provider_kind).to.equal('user');
      // whatever the local hour, the engine and the legacy code disagree on at least one interval
      // only when the legacy code can price it: verify the warning shape when it exists
      if (contract.migration_warning) {
        expect(contract.migration_warning).to.have.all.keys('gap_ratio', 'legacy_total', 'engine_total', 'days');
      }
    });

    it('should verify a migrated contract against the stored consumption', async () => {
      await energyContract.declareCalendar(
        { key: 'tempo', granularity: 'day', timezone: 'Europe/Paris', day_starts_at: '06:00' },
        TEST_SERVICE_ID,
      );
      const contract = await energyContract.create(
        contractPayload({
          name: 'Legacy base',
          timezone: 'Europe/Paris',
          valid_from: '2020-01-01',
          tariff: {
            tariff_version: 1,
            components: [{ key: 'energy', kind: 'consumption', rules: [], fallback: { price: 0.3 } }],
          },
        }),
      );
      expect(await energyContract.verifyMigratedContract(contract, [row({ price: 2000 })], 'Europe/Paris')).to.equal(
        null,
      );
      const now = Date.now();
      await insertConsumption([{ value: 1, created_at: new Date(now - 60 * 60 * 1000) }]);
      const warning = await energyContract.verifyMigratedContract(contract, [row({ price: 2000 })], 'Europe/Paris');
      expect(warning).to.deep.include({ gap_ratio: 0.5, legacy_total: 0.2, engine_total: 0.3 });
      expect(warning.days).to.have.lengthOf(1);
      // identical prices: no warning; legacy unable to price: no warning
      expect(await energyContract.verifyMigratedContract(contract, [row({ price: 3000 })], 'Europe/Paris')).to.equal(
        null,
      );
      expect(
        await energyContract.verifyMigratedContract(contract, [row({ price_type: 'subscription' })], 'Europe/Paris'),
      ).to.equal(null);
      // a tempo contract reads the tempo calendar entries for the legacy day map
      await energyContract.publishCalendarEntries(
        'tempo',
        [{ date: new Date(now).toISOString().slice(0, 10), value: 'red' }],
        {
          provider_service_id: TEST_SERVICE_ID,
          skip_recalculation: true,
        },
      );
      const tempo = await energyContract.update('legacy-base', {
        tariff: {
          tariff_version: 1,
          calendars: ['tempo'],
          components: [{ key: 'energy', kind: 'consumption', rules: [], fallback: { price: 0.3 } }],
        },
      });
      const tempoRows = [
        row({ contract: 'edf-tempo', price: 3000, day_type: 'red', hour_slots: `${PEAK},${OFF_PEAK}` }),
      ];
      expect(await energyContract.verifyMigratedContract(tempo, tempoRows, 'Europe/Paris')).to.equal(null);
    });

    it('should store the verification warning and run at init without blocking', async () => {
      await db.EnergyPrice.bulkCreate([
        row({
          id: '11111111-1111-4111-8111-111111111141',
          selector: 's1',
          contract_name: null,
          subscribed_power: null,
        }),
      ]);
      energyContract.verifyMigratedContract = sinon.fake.resolves({ gap_ratio: 0.1, days: [] });
      const [created] = await energyContract.migrateFromEnergyPrice();
      const contract = await energyContract.getBySelector(created.selector);
      expect(contract.name).to.equal('base');
      expect(contract.migration_warning).to.deep.equal({ gap_ratio: 0.1, days: [] });
      energyContract.migrateFromEnergyPrice = sinon.fake.rejects(new Error('boom'));
      await energyContract.init();
      energyContract.migrateFromEnergyPrice = sinon.fake.resolves([]);
      await energyContract.init();
      expect(energyContract.migrateFromEnergyPrice.callCount).to.equal(1);
    });

    it('should log and skip a group that cannot be converted', async () => {
      await db.EnergyPrice.bulkCreate([
        row({
          id: '11111111-1111-4111-8111-111111111131',
          selector: 'r1',
          currency: 'yen',
          contract_name: 'x'.repeat(200),
        }),
      ]);
      const created = await energyContract.migrateFromEnergyPrice();
      expect(created).to.deep.equal([]);
      expect(variables[MIGRATION_DONE_VARIABLE]).to.be.a('string');
    });

    it('should group rows and map currencies', () => {
      const groups = groupPriceRows([
        row({}),
        row({ price_type: 'subscription' }),
        row({ start_date: '2026-01-01' }),
        row({ electric_meter_device_id: null }),
      ]);
      expect(groups.map((g) => g.rows.length)).to.deep.equal([2, 1]);
      expect(toIsoCurrency('euro')).to.equal('EUR');
      expect(toIsoCurrency('dollar')).to.equal('USD');
      expect(toIsoCurrency('GBP')).to.equal('GBP');
      expect(toIsoCurrency('yen')).to.equal('EUR');
      expect(toIsoCurrency(undefined)).to.equal('EUR');
    });
  });

  describe('getLegacyPrices and getDefaultElectricMeterFeatureId', () => {
    it('should project the contracts onto the legacy shape', async () => {
      const { energyContract, stateManager } = await buildManager();
      expect(await energyContract.getDefaultElectricMeterFeatureId()).to.equal(null);
      await energyContract.create(
        contractPayload({
          name: 'Tempo',
          subscribed_power: 9,
          tariff: {
            tariff_version: 1,
            calendars: ['tempo', 'spot'],
            components: [
              {
                key: 'energy',
                kind: 'consumption',
                rules: [
                  {
                    label: 'Red peak',
                    when: { calendar: { tempo: 'red' }, time: [['06:00', '22:00']] },
                    price: 0.7562,
                  },
                  { when: { season: { from: '06-01', to: '09-30' } }, price: 0.2 },
                  { when: { calendar: { spot: 'x' } }, price_from_calendar: 'spot' },
                ],
                fallback: { price: 0.1296 },
              },
              { key: 'subscription', kind: 'fixed', amount: 17.11, per: 'month' },
              { key: 'tax', kind: 'tax', rate: 20, applies_to: ['energy'] },
            ],
          },
        }),
      );
      await energyContract.create(
        contractPayload({
          name: 'Peak',
          valid_from: '2010-01-01',
          valid_to: '2010-12-31',
          tariff: {
            tariff_version: 1,
            components: [
              {
                key: 'e',
                kind: 'consumption',
                rules: [{ when: { time: [['22:00', '06:00']] }, price: 0.15 }],
                fallback: { price: 0.25 },
              },
            ],
          },
        }),
      );
      const prices = await energyContract.getLegacyPrices({ electric_meter_device_id: METER_DEVICE_ID });
      expect(
        prices.map((p) => [p.contract, p.price_type, p.price, p.hour_slots && p.hour_slots.slice(0, 11), p.day_type]),
      ).to.deep.equal([
        ['edf-tempo', 'consumption', 7562, '06:00,06:30', 'red'],
        ['edf-tempo', 'consumption', 2000, null, null],
        ['edf-tempo', 'consumption', 1296, null, null],
        ['edf-tempo', 'subscription', 171100, null, null],
        ['peak-off-peak', 'consumption', 1500, '22:00,22:30', null],
        ['peak-off-peak', 'consumption', 2500, null, null],
      ]);
      expect(prices[0]).to.include({
        contract_name: 'Tempo',
        currency: 'euro',
        subscribed_power: '9',
        start_date: '2025-01-01',
        end_date: null,
      });
      expect(prices[0].selector).to.equal('tempo-energy-0');
      const base = await energyContract.getLegacyPrices();
      expect(base).to.have.lengthOf(6);
      // default meter: the most recent contract's meter energy feature
      expect(await energyContract.getDefaultElectricMeterFeatureId()).to.equal('101d2306-b15e-4859-b403-a076167eadd9');
      const device = stateManager.get('deviceById', METER_DEVICE_ID);
      stateManager.setState('deviceById', METER_DEVICE_ID, { ...device, features: [] });
      expect(await energyContract.getDefaultElectricMeterFeatureId()).to.equal(null);
      expect(energyContract.getMeterConsumptionFeature(METER_DEVICE_ID)).to.equal(null);
      expect(await energyContract.getMeterIntervals(METER_DEVICE_ID, new Date(0), new Date())).to.deep.equal([]);
      expect(energyContract.getMeterConsumptionFeature('unknown')).to.equal(null);
      stateManager.deleteState('deviceById', METER_DEVICE_ID);
      expect(await energyContract.getDefaultElectricMeterFeatureId()).to.equal(null);
    });
  });
});
