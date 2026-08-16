const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const db = require('../../../models');
const Weather = require('../../../lib/weather');
const { EVENTS, WEATHER_TRIGGER_FIELDS } = require('../../../utils/constants');

const HOUSE = { selector: 'weather-trigger-house', latitude: 48.85, longitude: 2.35 };

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

describe('weather.checkTriggers', () => {
  let scene;
  // the bootstrap cleans and re-seeds the database between every test:
  // the listening scene must be re-created each time. The create also
  // exercises the new Joi `weather_field` of the scene model.
  beforeEach(async () => {
    scene = await db.Scene.create({
      name: 'Weather trigger scene test',
      icon: 'fe-cloud',
      active: true,
      triggers: [
        {
          type: EVENTS.WEATHER.MATCHED,
          house: HOUSE.selector,
          weather_field: WEATHER_TRIGGER_FIELDS.WIND_SPEED,
          operator: '>',
          value: 20,
        },
      ],
      actions: [[]],
    });
  });
  afterEach(() => {
    sinon.reset();
  });

  it('should not call any provider when no active scene listens to the weather trigger', async () => {
    await db.Scene.update({ active: false }, { where: { id: scene.id } });
    const { weather, provider } = buildWeather([{ temperature: 12 }]);
    await weather.checkTriggers();
    expect(provider.weather.get.callCount).to.equal(0);
  });

  it('should baseline on the first poll and send both payloads on the next ones', async () => {
    const first = { temperature: 12, wind_speed: 2 };
    const second = { temperature: 14, wind_speed: 8 };
    const { weather, event, provider } = buildWeather([first, second]);

    // poll 1: baseline, no event — a restart while it is already windy
    // must not re-run every weather scene
    await weather.checkTriggers();
    expect(triggerCheckCalls(event)).to.have.lengthOf(0);

    // poll 2: the trigger check gets the current and the previous payload
    await weather.checkTriggers();
    const calls = triggerCheckCalls(event);
    expect(calls).to.have.lengthOf(1);
    expect(calls[0].args[1]).to.deep.equal({
      type: EVENTS.WEATHER.MATCHED,
      house: HOUSE.selector,
      weather: second,
      previous_weather: first,
    });
    // the house without coordinates is skipped: one call per poll
    expect(provider.weather.get.callCount).to.equal(2);
  });

  it('should drop a check landing while another one is still in flight', async () => {
    let resolveInFlight;
    const inFlight = new Promise((resolve) => {
      resolveInFlight = resolve;
    });
    let call = 0;
    const provider = {
      weather: {
        get: fake(() => {
          call += 1;
          return call === 1 ? Promise.resolve({ temperature: 2 }) : inFlight;
        }),
      },
    };
    const service = { getService: () => provider, stateManager: { getAllKeys: () => ['ext-fake-weather'] } };
    const event = { on: fake.returns(null), emit: fake.returns(null) };
    const house = { get: fake.resolves([HOUSE]) };
    const weather = new Weather(service, event, {}, house);

    // poll 1: baseline
    await weather.checkTriggers();

    // poll 2 hangs on the provider; poll 3 lands while it is in flight
    // and must be dropped immediately, without waiting for the provider
    const second = weather.checkTriggers();
    const third = weather.checkTriggers();
    await third;
    resolveInFlight({ temperature: 5 });
    await second;

    expect(provider.weather.get.callCount).to.equal(2);
    expect(triggerCheckCalls(event)).to.have.lengthOf(1);

    // the guard is released: a later check polls and compares again
    await weather.checkTriggers();
    expect(provider.weather.get.callCount).to.equal(3);
    expect(triggerCheckCalls(event)).to.have.lengthOf(2);
  });

  it('should keep the previous payload when the provider fails', async () => {
    const payload = { temperature: 12, wind_speed: 2 };
    const { weather, event, provider } = buildWeather([payload, new Error('provider down'), payload]);
    await weather.checkTriggers();
    await weather.checkTriggers();
    // the failing poll emitted nothing at all
    expect(triggerCheckCalls(event)).to.have.lengthOf(0);
    await weather.checkTriggers();
    const calls = triggerCheckCalls(event);
    expect(provider.weather.get.callCount).to.equal(3);
    // the baseline of the first poll survived the failure
    expect(calls).to.have.lengthOf(1);
    expect(calls[0].args[1].previous_weather).to.deep.equal(payload);
  });
});
