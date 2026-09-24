const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const db = require('../../../../models');
const { EVENTS } = require('../../../../utils/constants');
const { buildManager, contractPayload, TEMPO_TARIFF, METER_DEVICE_ID, TEST_SERVICE_ID } = require('./helpers');
const { RECALCULATION_MIN_INTERVAL_MS } = require('../../../../lib/energy-contract/calendar.publish');
const { validateCalendarDefinition } = require('../../../../lib/energy-contract/calendar.declare');

const OTHER_SERVICE_ID = 'b810b8db-6d04-4697-bed3-c4b72c996280';
const TEMPO = {
  key: 'tempo',
  granularity: 'day',
  timezone: 'Europe/Paris',
  day_starts_at: '06:00',
  values: ['blue', 'white', 'red'],
};
const SPOT = { key: 'spot-fr', granularity: 'thirty_minutes', currency: 'EUR' };

describe('energyContract: tariff calendars', () => {
  let energyContract;
  let event;
  beforeEach(async () => {
    ({ energyContract, event } = await buildManager());
    await db.Service.create({
      id: OTHER_SERVICE_ID,
      name: 'other-service',
      selector: 'other-service',
      version: '0.1.0',
      status: 'RUNNING',
    });
  });
  afterEach(() => {
    energyContract.calendarRecalculations.forEach((state) => clearTimeout(state.timer));
  });

  describe('declareCalendar', () => {
    it('should create, refresh, refuse another owner, claim an orphan and refuse a granularity change', async () => {
      const created = await energyContract.declareCalendar(TEMPO, TEST_SERVICE_ID);
      expect(created.accepted).to.equal(true);
      expect(created.calendar).to.include({
        key: 'tempo',
        granularity: 'day',
        timezone: 'Europe/Paris',
        day_starts_at: '06:00',
        provider_service_id: TEST_SERVICE_ID,
        currency: null,
      });
      // same owner: metadata refreshed
      const refreshed = await energyContract.declareCalendar(
        { ...TEMPO, values: ['blue', 'white', 'red', 'black'] },
        TEST_SERVICE_ID,
      );
      expect(refreshed.accepted).to.equal(true);
      expect(refreshed.calendar.values).to.deep.equal(['blue', 'white', 'red', 'black']);
      // another integration: installed but its declaration refused
      const refused = await energyContract.declareCalendar(TEMPO, OTHER_SERVICE_ID);
      expect(refused.accepted).to.equal(false);
      expect(refused.reason).to.match(/already provided by another integration/);
      expect(refused.calendar.provider_service_id).to.equal(TEST_SERVICE_ID);
      // uninstall of the owner: orphaned, then claimed with the same granularity
      expect(await energyContract.releaseCalendars(TEST_SERVICE_ID)).to.equal(1);
      expect(await energyContract.releaseCalendars(TEST_SERVICE_ID)).to.equal(0);
      const [orphan] = await energyContract.getCalendars();
      expect(orphan.orphaned).to.equal(true);
      await expect(
        energyContract.declareCalendar({ ...TEMPO, granularity: 'thirty_minutes' }, OTHER_SERVICE_ID),
      ).to.be.rejectedWith(/cannot become "thirty_minutes"/);
      const claimed = await energyContract.declareCalendar(TEMPO, OTHER_SERVICE_ID);
      expect(claimed.accepted).to.equal(true);
      expect(claimed.calendar.provider_service_id).to.equal(OTHER_SERVICE_ID);
    });

    it('should validate the declaration and default the timezone to the system one', async () => {
      await expect(energyContract.declareCalendar({ key: 'Bad Key' }, null)).to.be.rejectedWith(/calendar key/);
      await expect(energyContract.declareCalendar({ key: 'ok', timezone: 'Mars/Olympus' }, null)).to.be.rejectedWith(
        /not a known IANA timezone/,
      );
      const { calendar } = await energyContract.declareCalendar({ key: 'holidays-fr', values: ['holiday'] }, null);
      expect(calendar.timezone).to.equal('Europe/Paris');
      expect(calendar.provider_service_id).to.equal(null);
      expect(validateCalendarDefinition({ key: 'x' }, 'UTC')).to.include({ timezone: 'UTC', day_starts_at: '00:00' });
    });
  });

  describe('publishCalendarEntries', () => {
    beforeEach(async () => {
      await energyContract.declareCalendar(TEMPO, TEST_SERVICE_ID);
      await energyContract.declareCalendar(SPOT, TEST_SERVICE_ID);
    });

    it('should upsert daily values by date, track the coverage and report changed_from', async () => {
      const first = await energyContract.publishCalendarEntries(
        'tempo',
        [
          { date: '2026-01-12', value: 'red' },
          { date: '2026-01-13', value: 'white' },
        ],
        { provider_service_id: TEST_SERVICE_ID, skip_recalculation: true },
      );
      expect(first.count).to.equal(2);
      expect(first.changed_from.toISOString()).to.equal('2026-01-11T23:00:00.000Z');
      const entries = await energyContract.getCalendarEntries('tempo', { from: '2026-01-01', to: '2026-02-01' });
      expect(entries).to.deep.equal([
        { starts_at: '2026-01-11T23:00:00.000Z', value: 'red' },
        { starts_at: '2026-01-12T23:00:00.000Z', value: 'white' },
      ]);
      // same values: nothing changed
      const same = await energyContract.publishCalendarEntries('tempo', [{ date: '2026-01-12', value: 'red' }], {
        provider_service_id: TEST_SERVICE_ID,
        skip_recalculation: true,
      });
      expect(same.changed_from).to.equal(null);
      // a corrected colour and a new day: changed from the earliest change
      const corrected = await energyContract.publishCalendarEntries(
        'tempo',
        [
          { date: '2026-01-13', value: 'blue' },
          { starts_at: '2026-01-13T23:00:00.000Z', value: 'red' },
        ],
        { provider_service_id: TEST_SERVICE_ID, skip_recalculation: true },
      );
      expect(corrected.changed_from.toISOString()).to.equal('2026-01-12T23:00:00.000Z');
      const calendar = await energyContract.getCalendar('tempo');
      expect(new Date(calendar.first_at).toISOString()).to.equal('2026-01-11T23:00:00.000Z');
      expect(new Date(calendar.last_at).toISOString()).to.equal('2026-01-13T23:00:00.000Z');
      expect(calendar.provider_service.selector).to.equal('test-service');
      // a core service has no manifest: its name is shown; an integration shows its manifest name
      expect(calendar.provider_service.display_name).to.equal(calendar.provider_service.name);
      await db.Service.update({ manifest: { name: 'Tempo provider' } }, { where: { id: TEST_SERVICE_ID } });
      expect((await energyContract.getCalendar('tempo')).provider_service.display_name).to.equal('Tempo provider');
      await db.Service.update({ manifest: null }, { where: { id: TEST_SERVICE_ID } });
      const last = await energyContract.getCalendarEntries('tempo', { limit: 2 });
      expect(last.map((e) => e.value)).to.deep.equal(['blue', 'red']);
    });

    it('should upsert 30-minute prices', async () => {
      const result = await energyContract.publishCalendarEntries(
        'spot-fr',
        [
          { starts_at: '2026-01-12T05:00:00Z', price: 0.1823, currency: 'EUR' },
          { starts_at: '2026-01-12T05:30:00Z', price: -0.01 },
        ],
        { provider_service_id: TEST_SERVICE_ID, skip_recalculation: true },
      );
      expect(result.count).to.equal(2);
      const entries = await energyContract.getCalendarEntries('spot-fr', { from: '2026-01-12' });
      expect(entries.map((e) => e.value)).to.deep.equal([0.1823, -0.01]);
    });

    it('should refuse an unknown calendar, another owner and invalid entries', async () => {
      const publish = (key, entries, options = { provider_service_id: TEST_SERVICE_ID, skip_recalculation: true }) =>
        energyContract.publishCalendarEntries(key, entries, options);
      await expect(publish('nope', [{ date: '2026-01-12', value: 'red' }])).to.be.rejectedWith(/not declared/);
      await expect(
        publish('tempo', [{ date: '2026-01-12', value: 'red' }], { provider_service_id: OTHER_SERVICE_ID }),
      ).to.be.rejectedWith(/not provided by this integration/);
      await expect(publish('tempo', [])).to.be.rejectedWith(/non-empty array/);
      await expect(publish('tempo', 'x')).to.be.rejectedWith(/non-empty array/);
      await expect(publish('tempo', new Array(2001).fill({ date: '2026-01-12', value: 'red' }))).to.be.rejectedWith(
        /at most 2000 entries/,
      );
      await expect(publish('tempo', [null])).to.be.rejectedWith('entries[0]: must be an object');
      await expect(publish('tempo', [{ date: '12/01/2026', value: 'red' }])).to.be.rejectedWith(/YYYY-MM-DD/);
      await expect(publish('spot-fr', [{ date: '2026-01-12', price: 1 }])).to.be.rejectedWith(/takes starts_at/);
      await expect(publish('tempo', [{ starts_at: 'nope', value: 'red' }])).to.be.rejectedWith(/ISO date/);
      await expect(publish('tempo', [{ starts_at: '2026-01-12T00:00:00Z', value: 'red' }])).to.be.rejectedWith(
        /local midnight of Europe\/Paris/,
      );
      await expect(publish('spot-fr', [{ starts_at: '2026-01-12T05:10:00Z', price: 1 }])).to.be.rejectedWith(
        /aligned on a 30-minute slot of Europe\/Paris/,
      );
      // the slots of a :45 zone start at :15 and :45 UTC
      await energyContract.declareCalendar(
        { key: 'spot-np', granularity: 'thirty_minutes', timezone: 'Asia/Kathmandu' },
        TEST_SERVICE_ID,
      );
      await expect(publish('spot-np', [{ starts_at: '2026-01-12T05:00:00Z', price: 1 }])).to.be.rejectedWith(
        /aligned on a 30-minute slot of Asia\/Kathmandu/,
      );
      expect((await publish('spot-np', [{ starts_at: '2026-01-12T05:15:00Z', price: 1 }])).count).to.equal(1);
      await expect(publish('tempo', [{ date: '2026-01-12' }])).to.be.rejectedWith(/exactly one of value or price/);
      await expect(publish('tempo', [{ date: '2026-01-12', value: 'red', price: 1 }])).to.be.rejectedWith(
        /exactly one of value or price/,
      );
      await expect(publish('tempo', [{ date: '2026-01-12', value: 'green' }])).to.be.rejectedWith(
        /"green" is not in \[blue, white, red\]/,
      );
      await expect(publish('tempo', [{ date: '2026-01-12', value: '' }])).to.be.rejectedWith(/1 to 64 characters/);
      await expect(publish('tempo', [{ date: '2026-01-12', price: 1 }])).to.be.rejectedWith(/takes string values/);
      await expect(publish('spot-fr', [{ starts_at: '2026-01-12T05:00:00Z', price: 'x' }])).to.be.rejectedWith(
        /finite number/,
      );
      await expect(
        publish('spot-fr', [{ starts_at: '2026-01-12T05:00:00Z', price: 1, currency: 'GBP' }]),
      ).to.be.rejectedWith(/is in EUR/);
      await expect(publish('tempo', [{ date: '2000-01-12', value: 'red' }])).to.be.rejectedWith(
        /between 5 years ago and 7 days ahead/,
      );
      await expect(publish('tempo', [{ date: '2099-01-12', value: 'red' }])).to.be.rejectedWith(/7 days ahead/);
    });

    it('should accept a string value on a calendar without a declared enum', async () => {
      await energyContract.declareCalendar({ key: 'free', granularity: 'day' }, null);
      const result = await energyContract.publishCalendarEntries('free', [{ date: '2026-01-12', value: 'anything' }], {
        skip_recalculation: true,
      });
      expect(result.count).to.equal(1);
    });

    it('should queue a recalculation of the meters referencing the calendar, bounded to one per 10 minutes', async () => {
      await energyContract.create(contractPayload({ name: 'Tempo', tariff: TEMPO_TARIFF, timezone: 'Europe/Paris' }));
      const emitted = sinon.fake();
      event.on(EVENTS.ENERGY_CONTRACT.RECALCULATE, emitted);
      await energyContract.publishCalendarEntries('tempo', [{ date: '2026-01-12', value: 'red' }], {
        provider_service_id: TEST_SERVICE_ID,
      });
      expect(emitted.callCount).to.equal(1);
      expect(emitted.firstCall.args[0]).to.deep.include({
        electric_meter_device_ids: [METER_DEVICE_ID],
        calendar_key: 'tempo',
      });
      expect(emitted.firstCall.args[0].from.toISOString()).to.equal('2026-01-11T23:00:00.000Z');
      // within the window: merged into a deferred run, keeping the earliest change
      const state = energyContract.calendarRecalculations.get('tempo');
      state.last_at = Date.now() - RECALCULATION_MIN_INTERVAL_MS + 50;
      await energyContract.publishCalendarEntries('tempo', [{ date: '2026-01-13', value: 'white' }], {
        provider_service_id: TEST_SERVICE_ID,
      });
      await energyContract.publishCalendarEntries('tempo', [{ date: '2026-01-10', value: 'blue' }], {
        provider_service_id: TEST_SERVICE_ID,
      });
      expect(emitted.callCount).to.equal(1);
      expect(state.timer).to.not.equal(null);
      await new Promise((resolve) => {
        setTimeout(resolve, 150);
      });
      expect(emitted.callCount).to.equal(2);
      expect(emitted.secondCall.args[0].from.toISOString()).to.equal('2026-01-09T23:00:00.000Z');
      // a calendar no contract references: nothing emitted
      await energyContract.publishCalendarEntries('spot-fr', [{ starts_at: '2026-01-12T05:00:00Z', price: 0.1 }], {
        provider_service_id: TEST_SERVICE_ID,
      });
      expect(emitted.callCount).to.equal(2);
      // an initial fill years before the first contract: recalculated from the contract start only
      state.last_at = 0;
      await energyContract.publishCalendarEntries('tempo', [{ date: '2022-01-01', value: 'blue' }], {
        provider_service_id: TEST_SERVICE_ID,
      });
      expect(emitted.callCount).to.equal(3);
      expect(emitted.thirdCall.args[0].from.toISOString()).to.equal('2024-12-31T23:00:00.000Z');
    });

    it('should log a failed deferred recalculation without throwing', async () => {
      const findAll = sinon.stub(db.EnergyContract, 'findAll').rejects(new Error('db down'));
      try {
        energyContract.calendarRecalculations.set('tempo', {
          last_at: Date.now() - RECALCULATION_MIN_INTERVAL_MS + 50,
          timer: null,
          from: null,
        });
        await energyContract.requestCalendarRecalculation('tempo', new Date('2026-01-12T00:00:00Z'));
        await new Promise((resolve) => {
          setTimeout(resolve, 150);
        });
        expect(findAll.callCount).to.equal(1);
      } finally {
        findAll.restore();
      }
    });
  });

  describe('read and purge', () => {
    it('should list calendars, load a lookup for a window and purge old entries', async () => {
      await energyContract.declareCalendar(TEMPO, TEST_SERVICE_ID);
      await energyContract.publishCalendarEntries(
        'tempo',
        [
          { date: '2026-01-12', value: 'red' },
          { date: '2026-01-13', value: 'white' },
          { date: '2026-01-20', value: 'blue' },
        ],
        { provider_service_id: TEST_SERVICE_ID, skip_recalculation: true },
      );
      const lookup = await energyContract.loadCalendarLookup(
        ['tempo', 'unknown'],
        Date.UTC(2026, 0, 13, 0),
        Date.UTC(2026, 0, 13, 12),
        'Europe/Paris',
      );
      expect(lookup.keys()).to.deep.equal(['tempo']);
      // 03:00 Paris on the 13th: still the 12th (day starts at 06:00)
      expect(lookup.get('tempo', Date.UTC(2026, 0, 13, 2))).to.equal('red');
      expect(lookup.get('tempo', Date.UTC(2026, 0, 13, 12))).to.equal('white');
      expect(lookup.get('tempo', Date.UTC(2026, 0, 20, 12))).to.equal(undefined);
      const empty = await energyContract.loadCalendarLookup([], 0, 1, 'UTC');
      expect(empty.keys()).to.deep.equal([]);
      expect(await energyContract.purgeCalendarEntries(new Date('2026-01-01T00:00:00Z'))).to.equal(0);
      expect(await energyContract.purgeCalendarEntries(new Date('2026-01-12T12:00:00Z'))).to.equal(1);
      const calendar = await energyContract.getCalendar('tempo');
      expect(new Date(calendar.first_at).toISOString()).to.equal('2026-01-12T23:00:00.000Z');
      expect(await energyContract.purgeCalendarEntries(new Date('2027-01-01T00:00:00Z'))).to.equal(2);
      expect((await energyContract.getCalendar('tempo')).first_at).to.equal(null);
      await expect(energyContract.getCalendar('nope')).to.be.rejectedWith(/not declared/);
      await expect(energyContract.getCalendarEntries('nope')).to.be.rejectedWith(/not declared/);
      expect(await energyContract.getCalendarEntries('tempo')).to.deep.equal([]);
    });
  });
});
