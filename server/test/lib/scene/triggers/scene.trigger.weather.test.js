const sinon = require('sinon').createSandbox();
const { expect } = require('chai');

const { assert, fake } = sinon;

const EventEmitter = require('events');
const StateManager = require('../../../../lib/state');
const SceneManager = require('../../../../lib/scene');
const { triggersFunc } = require('../../../../lib/scene/scene.triggers');
const { ACTIONS, EVENTS, WEATHER_TRIGGER_FIELDS } = require('../../../../utils/constants');

const event = new EventEmitter();

const matcher = triggersFunc[EVENTS.WEATHER.MATCHED];

const buildEvent = (weather, previousWeather, house = 'my-house') => ({
  type: EVENTS.WEATHER.MATCHED,
  house,
  weather,
  previous_weather: previousWeather,
});

describe('Scene.triggers.weather', () => {
  let sceneManager;

  const device = {
    setValue: fake.resolves(null),
  };

  const brain = {};

  const service = {
    getService: fake.returns(null),
  };

  beforeEach(() => {
    const house = {
      get: fake.resolves([]),
    };

    const scheduler = {
      scheduleJob: (date, callback) => {
        return {
          callback,
          date,
          cancel: () => {},
        };
      },
    };

    brain.addNamedEntity = fake.returns(null);
    brain.removeNamedEntity = fake.returns(null);

    const stateManager = new StateManager();

    sceneManager = new SceneManager(stateManager, event, device, {}, {}, house, {}, {}, {}, scheduler, brain, service);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should execute the scene when the wind speed crosses the threshold', async () => {
    await sceneManager.addScene({
      selector: 'weather-scene',
      active: true,
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_OFF,
            devices: ['light-1'],
          },
        ],
      ],
      triggers: [
        {
          type: EVENTS.WEATHER.MATCHED,
          house: 'my-house',
          weather_field: WEATHER_TRIGGER_FIELDS.WIND_SPEED,
          operator: '>',
          value: 20,
        },
      ],
    });
    // 8 m/s = 28.8 km/h, previously 2 m/s = 7.2 km/h
    sceneManager.checkTrigger(buildEvent({ wind_speed: 8 }, { wind_speed: 2 }));
    return new Promise((resolve, reject) => {
      sceneManager.queue.start(() => {
        try {
          assert.calledOnce(device.setValue);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });

  it('should not match another house', () => {
    const trigger = {
      house: 'my-house',
      weather_field: WEATHER_TRIGGER_FIELDS.TEMPERATURE,
      operator: '<',
      value: 0,
    };
    expect(matcher(null, 'scene', buildEvent({ temperature: -3 }, { temperature: 5 }, 'other'), trigger)).to.equal(
      false,
    );
  });

  it('should compare the wind speed in km/h', () => {
    const trigger = {
      house: 'my-house',
      weather_field: WEATHER_TRIGGER_FIELDS.WIND_SPEED,
      operator: '>',
      value: 20,
    };
    // 6 m/s = 21.6 km/h, above the threshold expressed in km/h
    expect(matcher(null, 'scene', buildEvent({ wind_speed: 6 }, { wind_speed: 1 }), trigger)).to.equal(true);
    // 5 m/s = 18 km/h, below it — the raw m/s value would have matched
    expect(matcher(null, 'scene', buildEvent({ wind_speed: 5 }, { wind_speed: 1 }), trigger)).to.equal(false);
    // a provider that does not expose the wind speed never matches
    expect(matcher(null, 'scene', buildEvent({ temperature: 12 }, { wind_speed: 1 }), trigger)).to.equal(false);
  });

  it('should compare the numbers as the dashboard widget displays them', () => {
    const windTrigger = {
      house: 'my-house',
      weather_field: WEATHER_TRIGGER_FIELDS.WIND_SPEED,
      operator: '>=',
      value: 20,
    };
    // 5.55 m/s = 19.98 km/h, displayed as "20 km/h" by the widget: the
    // rule the user reads on their dashboard must match
    expect(matcher(null, 'scene', buildEvent({ wind_speed: 5.55 }, { wind_speed: 1 }), windTrigger)).to.equal(true);
    // 5.41 m/s = 19.47 km/h, displayed as "19 km/h": still below
    expect(matcher(null, 'scene', buildEvent({ wind_speed: 5.41 }, { wind_speed: 1 }), windTrigger)).to.equal(false);

    // same display-vs-compare rule for the temperature and the humidity
    const frostTrigger = {
      house: 'my-house',
      weather_field: WEATHER_TRIGGER_FIELDS.TEMPERATURE,
      operator: '<=',
      value: 0,
    };
    // 0.4 °C is displayed as "0°": the frost alert fires
    expect(matcher(null, 'scene', buildEvent({ temperature: 0.4 }, { temperature: 5 }), frostTrigger)).to.equal(true);
    expect(matcher(null, 'scene', buildEvent({ temperature: 0.6 }, { temperature: 5 }), frostTrigger)).to.equal(false);

    const humidityTrigger = {
      house: 'my-house',
      weather_field: WEATHER_TRIGGER_FIELDS.HUMIDITY,
      operator: '>=',
      value: 90,
    };
    expect(matcher(null, 'scene', buildEvent({ humidity: 89.5 }, { humidity: 40 }), humidityTrigger)).to.equal(true);
    expect(matcher(null, 'scene', buildEvent({ humidity: 89.4 }, { humidity: 40 }), humidityTrigger)).to.equal(false);
  });

  it('should only fire on the transition, not while the rule stays true', () => {
    const trigger = {
      house: 'my-house',
      weather_field: WEATHER_TRIGGER_FIELDS.TEMPERATURE,
      operator: '<=',
      value: 0,
    };
    // the frost starts
    expect(matcher(null, 'scene', buildEvent({ temperature: -1 }, { temperature: 3 }), trigger)).to.equal(true);
    // it lasts: the scene must not run again at the next poll
    expect(matcher(null, 'scene', buildEvent({ temperature: -4 }, { temperature: -1 }), trigger)).to.equal(false);
    // it ends: nothing either
    expect(matcher(null, 'scene', buildEvent({ temperature: 4 }, { temperature: -4 }), trigger)).to.equal(false);
  });

  it('should fire when the previous payload does not carry the watched property', () => {
    const trigger = {
      house: 'my-house',
      weather_field: WEATHER_TRIGGER_FIELDS.HUMIDITY,
      operator: '>=',
      value: 90,
    };
    // no previous payload at all (event built without one)
    expect(matcher(null, 'scene', buildEvent({ humidity: 95 }), trigger)).to.equal(true);
    // a previous payload that does not expose the property
    expect(matcher(null, 'scene', buildEvent({ humidity: 95 }, { temperature: 3 }), trigger)).to.equal(true);
    // an explicitly null previous payload
    expect(matcher(null, 'scene', buildEvent({ humidity: 95 }, null), trigger)).to.equal(true);
    // a null current value never matches
    expect(matcher(null, 'scene', buildEvent({ humidity: null }, { humidity: 10 }), trigger)).to.equal(false);
    // a null previous value is not a previous match: the trigger fires
    expect(matcher(null, 'scene', buildEvent({ humidity: 95 }, { humidity: null }), trigger)).to.equal(true);
  });

  it('should compare the weather condition as a string of the pivot enum', () => {
    const trigger = {
      house: 'my-house',
      weather_field: WEATHER_TRIGGER_FIELDS.CONDITION,
      operator: '=',
      value: 'thunderstorm',
    };
    expect(matcher(null, 'scene', buildEvent({ weather: 'thunderstorm' }, { weather: 'cloud' }), trigger)).to.equal(
      true,
    );
    expect(
      matcher(null, 'scene', buildEvent({ weather: 'thunderstorm' }, { weather: 'thunderstorm' }), trigger),
    ).to.equal(false);
    expect(matcher(null, 'scene', buildEvent({ weather: 'rain' }, { weather: 'cloud' }), trigger)).to.equal(false);
    // "the weather is no longer clear"
    const notClear = { ...trigger, operator: '!=', value: 'clear' };
    expect(matcher(null, 'scene', buildEvent({ weather: 'rain' }, { weather: 'clear' }), notClear)).to.equal(true);
  });

  it('should never match a numeric rule without a usable value', () => {
    const trigger = {
      house: 'my-house',
      weather_field: WEATHER_TRIGGER_FIELDS.TEMPERATURE,
      operator: '<',
    };
    // value left empty in the UI
    expect(matcher(null, 'scene', buildEvent({ temperature: -3 }, { temperature: 5 }), trigger)).to.equal(false);
    expect(
      matcher(null, 'scene', buildEvent({ temperature: -3 }, { temperature: 5 }), { ...trigger, value: 'abc' }),
    ).to.equal(false);
    // a numeric value stored as a string stays comparable
    expect(
      matcher(null, 'scene', buildEvent({ temperature: -3 }, { temperature: 5 }), { ...trigger, value: '0' }),
    ).to.equal(true);
  });

  it('should never match an unknown watched property', () => {
    const trigger = {
      house: 'my-house',
      weather_field: 'pressure',
      operator: '>',
      value: 1000,
    };
    expect(matcher(null, 'scene', buildEvent({ pressure: 1020 }, { pressure: 990 }), trigger)).to.equal(false);
  });
});
