const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const db = require('../../../models');
const Weather = require('../../../lib/weather');
const { EVENTS } = require('../../../utils/constants');

const HOUSE = { selector: 'alert-house', latitude: 48.85, longitude: 2.35 };

const buildWeather = (getResults) => {
  // getResults: array of payloads (or Error) returned by successive polls
  let call = -1;
  const provider = {
    weather: {
      get: fake(async () => {
        call += 1;
        const result = getResults[Math.min(call, getResults.length - 1)];
        if (result instanceof Error) {
          throw result;
        }
        return result;
      }),
    },
  };
  const service = {
    getService: () => provider,
    stateManager: {
      getAllKeys: () => ['ext-fake-weather'],
    },
  };
  const event = { on: fake.returns(null), emit: fake.returns(null) };
  const house = { get: fake.resolves([HOUSE, { selector: 'no-gps-house', latitude: null, longitude: null }]) };
  const weather = new Weather(service, event, {}, house);
  return { weather, event, provider, house };
};

const triggerCheckCalls = (event) =>
  event.emit.getCalls().filter((callObject) => callObject.args[0] === EVENTS.TRIGGERS.CHECK);

describe('weather.checkAlerts', () => {
  let scene;
  // the bootstrap cleans and re-seeds the database between every test:
  // the listening scene must be re-created each time. The create also
  // exercises the new Joi trigger fields of the scene model.
  beforeEach(async () => {
    scene = await db.Scene.create({
      name: 'Weather alert scene test',
      icon: 'fe-bell',
      active: true,
      triggers: [
        {
          type: EVENTS.WEATHER.ALERT_RAISED,
          house: HOUSE.selector,
          weather_alert_type: 'any',
          weather_alert_severity: 'minor',
        },
      ],
      actions: [[]],
    });
  });
  afterEach(() => {
    sinon.reset();
  });

  it('should not call any provider when no active scene listens to weather alerts', async () => {
    await db.Scene.update({ active: false }, { where: { id: scene.id } });
    const { weather, provider } = buildWeather([{ alerts: [] }]);
    await weather.checkAlerts();
    expect(provider.weather.get.callCount).to.equal(0);
  });

  it('should baseline on the first poll and fire raised/worsened/ended on the next ones', async () => {
    const windMinor = { severity: 'moderate', event: 'Vent violent', type: 'wind' };
    const windSevere = { severity: 'severe', event: 'Vent violent', type: 'wind' };
    const rain = { severity: 'severe', event: 'Pluie-inondation', type: 'rain' };
    const { weather, event } = buildWeather([
      { alerts: [windMinor] },
      { alerts: [windSevere, rain] },
      { alerts: [windMinor, rain] },
      { alerts: [] },
    ]);

    // poll 1: baseline, no events
    await weather.checkAlerts();
    expect(triggerCheckCalls(event)).to.have.lengthOf(0);

    // poll 2: wind worsened (raised) + rain appeared (raised)
    await weather.checkAlerts();
    let calls = triggerCheckCalls(event);
    expect(calls).to.have.lengthOf(2);
    expect(calls.map((callObject) => callObject.args[1].type)).to.deep.equal([
      EVENTS.WEATHER.ALERT_RAISED,
      EVENTS.WEATHER.ALERT_RAISED,
    ]);
    expect(calls[0].args[1].house).to.equal(HOUSE.selector);
    expect(calls[0].args[1].alert).to.deep.equal(windSevere);
    expect(calls[1].args[1].alert).to.deep.equal(rain);

    // poll 3: wind de-escalates without clearing -> nothing
    event.emit.resetHistory();
    await weather.checkAlerts();
    expect(triggerCheckCalls(event)).to.have.lengthOf(0);

    // poll 4: both alerts end
    event.emit.resetHistory();
    await weather.checkAlerts();
    calls = triggerCheckCalls(event);
    expect(calls).to.have.lengthOf(2);
    calls.forEach((callObject) => {
      expect(callObject.args[1].type).to.equal(EVENTS.WEATHER.ALERT_ENDED);
    });
  });

  it('should key untyped alerts by their normalized event text', async () => {
    const untyped = { severity: 'moderate', event: '  Phénomène Local  ' };
    const sameUntyped = { severity: 'moderate', event: 'phénomène local' };
    const { weather, event } = buildWeather([{ alerts: [untyped] }, { alerts: [sameUntyped] }]);
    await weather.checkAlerts();
    await weather.checkAlerts();
    // same identity after trim + lowercase: no raised, no ended
    expect(triggerCheckCalls(event)).to.have.lengthOf(0);
  });

  it('should treat a payload without alerts as no alerts', async () => {
    const { weather, event } = buildWeather([
      { alerts: [{ severity: 'severe', event: 'Orages', type: 'thunderstorm' }] },
      {},
    ]);
    await weather.checkAlerts();
    await weather.checkAlerts();
    const calls = triggerCheckCalls(event);
    expect(calls).to.have.lengthOf(1);
    expect(calls[0].args[1].type).to.equal(EVENTS.WEATHER.ALERT_ENDED);
  });

  it('should drop a check landing while another one is still in flight', async () => {
    const alert = { severity: 'severe', event: 'Orages', type: 'thunderstorm' };
    let resolveInFlight;
    const inFlight = new Promise((resolve) => {
      resolveInFlight = resolve;
    });
    let call = 0;
    const provider = {
      weather: {
        get: fake(() => {
          call += 1;
          return call === 1 ? Promise.resolve({ alerts: [] }) : inFlight;
        }),
      },
    };
    const service = { getService: () => provider, stateManager: { getAllKeys: () => ['ext-fake-weather'] } };
    const event = { on: fake.returns(null), emit: fake.returns(null) };
    const house = { get: fake.resolves([HOUSE]) };
    const weather = new Weather(service, event, {}, house);

    // poll 1: baseline
    await weather.checkAlerts();

    // poll 2 hangs on the provider; poll 3 lands while it is in flight
    // and must be dropped immediately, without waiting for the provider
    const second = weather.checkAlerts();
    const third = weather.checkAlerts();
    await third;
    resolveInFlight({ alerts: [alert] });
    await second;

    // one provider call per accepted run, one single raised event: the
    // overlapping check never diffed the same baseline a second time
    expect(provider.weather.get.callCount).to.equal(2);
    const calls = triggerCheckCalls(event);
    expect(calls).to.have.lengthOf(1);
    expect(calls[0].args[1].type).to.equal(EVENTS.WEATHER.ALERT_RAISED);

    // the guard is released: a later check polls again (same alerts, so
    // still no new event)
    await weather.checkAlerts();
    expect(provider.weather.get.callCount).to.equal(3);
    expect(triggerCheckCalls(event)).to.have.lengthOf(1);
  });

  it('should keep the previous baseline when the provider fails', async () => {
    const alert = { severity: 'severe', event: 'Orages', type: 'thunderstorm' };
    const { weather, event, provider } = buildWeather([
      { alerts: [alert] },
      new Error('provider down'),
      { alerts: [alert] },
    ]);
    await weather.checkAlerts();
    await weather.checkAlerts();
    await weather.checkAlerts();
    // failure skipped, recovery identical to the baseline: no event at all
    expect(provider.weather.get.callCount).to.equal(3);
    expect(triggerCheckCalls(event)).to.have.lengthOf(0);
  });
});
