const { expect } = require('chai');
const nock = require('nock');
const sinon = require('sinon').createSandbox();

const { fake, useFakeTimers } = sinon;
const EdfTempoService = require('../../../services/edf-tempo');
const { TEMPO_CALENDAR } = require('../../../lib/energy-contract/templates/internal');

const SERVICE_ID = '35deac79-f295-4adf-8512-f2f48e1ea0f8';

const buildGladys = (overrides = {}) => ({
  gateway: {
    getEdfTempo: fake.resolves({ today: 'blue', tomorrow: 'unknown' }),
    getEdfTempoHistorical: fake.resolves([
      { created_at: '2022-12-08', day_type: 'blue' },
      { created_at: '2022-12-09', day_type: 'red' },
      { created_at: '2022-12-10', day_type: 'unknown' },
    ]),
  },
  energyContract: {
    declareCalendar: fake.resolves({ calendar: { key: 'tempo', last_at: null }, accepted: true }),
    publishCalendarEntries: fake.resolves({ count: 2, changed_from: new Date('2022-12-08T05:00:00Z') }),
  },
  scheduler: {
    scheduleJob: fake.returns('tempo-job'),
    cancelJob: fake.returns(null),
  },
  ...overrides,
});

describe('EdfTempoService', () => {
  let clock;
  beforeEach(async () => {
    nock.cleanAll();
    clock = useFakeTimers(1670563437931);
  });
  afterEach(() => {
    clock.restore();
    nock.cleanAll();
  });
  it('should start the service, publish the tempo calendar and schedule its refresh once', async () => {
    const gladys = buildGladys();
    const edfTempoService = EdfTempoService(gladys, SERVICE_ID);
    await edfTempoService.start();
    expect(gladys.energyContract.declareCalendar.firstCall.args).to.deep.equal([TEMPO_CALENDAR, SERVICE_ID]);
    // first run: three years of history
    expect(gladys.gateway.getEdfTempoHistorical.firstCall.args[0]).to.equal('2019-12-10');
    expect(gladys.energyContract.publishCalendarEntries.firstCall.args).to.deep.equal([
      'tempo',
      [
        { date: '2022-12-08', value: 'blue' },
        { date: '2022-12-09', value: 'red' },
      ],
      { provider_service_id: SERVICE_ID },
    ]);
    expect(gladys.scheduler.scheduleJob.callCount).to.equal(1);
    await edfTempoService.start();
    expect(gladys.scheduler.scheduleJob.callCount).to.equal(1);
    expect(gladys.energyContract.publishCalendarEntries.callCount).to.equal(2);
    // the scheduled refresh publishes again, and survives a gateway error
    const refresh = gladys.scheduler.scheduleJob.firstCall.args[1];
    await refresh();
    expect(gladys.energyContract.publishCalendarEntries.callCount).to.equal(3);
    gladys.gateway.getEdfTempoHistorical = fake.rejects(new Error('offline'));
    await refresh();
    expect(gladys.energyContract.publishCalendarEntries.callCount).to.equal(3);
    await edfTempoService.stop();
    expect(gladys.scheduler.cancelJob.firstCall.args[0]).to.equal('tempo-job');
    await edfTempoService.stop();
    expect(gladys.scheduler.cancelJob.callCount).to.equal(1);
  });
  it('should resume from the last known day and skip an empty answer', async () => {
    const gladys = buildGladys();
    gladys.energyContract.declareCalendar = fake.resolves({
      calendar: { key: 'tempo', last_at: new Date('2022-12-09T05:00:00Z') },
      accepted: true,
    });
    gladys.gateway.getEdfTempoHistorical = fake.resolves([]);
    const edfTempoService = EdfTempoService(gladys, SERVICE_ID);
    expect(await edfTempoService.publishTempoCalendar()).to.equal(null);
    expect(gladys.gateway.getEdfTempoHistorical.firstCall.args[0]).to.equal('2022-12-07');
    expect(gladys.energyContract.publishCalendarEntries.callCount).to.equal(0);
  });
  it('should start even when the calendar cannot be published', async () => {
    const gladys = buildGladys();
    gladys.energyContract.declareCalendar = fake.rejects(new Error('db down'));
    const edfTempoService = EdfTempoService(gladys, SERVICE_ID);
    await edfTempoService.start();
    expect(gladys.scheduler.scheduleJob.callCount).to.equal(1);
    expect(edfTempoService.energyContracts.templates[0].key).to.equal('edf-tempo');
    expect(edfTempoService.energyContracts.calendars[0].key).to.equal('tempo');
  });
  it('should get data', async () => {
    const edfTempoService = EdfTempoService(buildGladys(), SERVICE_ID);
    const data = await edfTempoService.getEdfTempoStates();
    expect(data).to.deep.equal({
      today_peak_state: 'blue',
      tomorrow_peak_state: 'not-defined',
      current_hour_peak_state: 'peak-hour',
    });
  });
});
