const { fake, assert } = require('sinon');
const EvenEmitter = require('events');
const dayjs = require('dayjs');
const Weather = require('../../../lib/weather');

const event = new EvenEmitter();

// single clock baseline: the fixture days and the request dates all derive
// from it, so they can never straddle midnight during the run
const TODAY = dayjs().startOf('day');

const fakeWeather = {
  temperature: 54.87,
  humidity: 0.76,
  pressure: 1019.4,
  datetime: new Date('2019-03-28T07:50:18.000Z'),
  units: 'metric',
  windSpeed: 5.25,
  weather: 'cloud',
  days: [
    {
      datetime: TODAY.add(0, 'day')
        .add(11, 'hour')
        .toISOString(),
      humidity: 65,
      pressure: 992,
      temperature_max: 11,
      temperature_min: 6,
      units: 'metric',
      weather: 'rain',
      wind_direction: 252,
      wind_speed: 3.13,
    },
    {
      datetime: TODAY.add(1, 'day')
        .add(11, 'hour')
        .toISOString(),
      humidity: 57,
      pressure: 997,
      temperature_max: 9,
      temperature_min: 4,
      units: 'metric',
      weather: 'clear',
      wind_direction: 324,
      wind_speed: 1.95,
    },
    {
      datetime: TODAY.add(2, 'day')
        .add(11, 'hour')
        .toISOString(),
      humidity: 67,
      pressure: 1000,
      temperature_max: 9,
      temperature_min: 5,
      units: 'metric',
      weather: 'cloud',
      wind_direction: 271,
      wind_speed: 3.23,
    },
    {
      datetime: TODAY.add(3, 'day')
        .add(11, 'hour')
        .toISOString(),
      humidity: 51,
      pressure: 1006,
      temperature_max: 10,
      temperature_min: 6,
      units: 'metric',
      weather: 'cloud',
      wind_direction: 304,
      wind_speed: 6.27,
    },
    {
      datetime: TODAY.add(4, 'day')
        .add(11, 'hour')
        .toISOString(),
      humidity: 86,
      pressure: 1004,
      temperature_max: 6,
      temperature_min: 5,
      units: 'metric',
      weather: 'rain',
      wind_direction: 43,
      wind_speed: 2.14,
    },
    {
      datetime: TODAY.add(5, 'day')
        .add(11, 'hour')
        .toISOString(),
      humidity: 61,
      pressure: 1010,
      temperature_max: 9,
      temperature_min: 4,
      units: 'metric',
      weather: 'clear',
      wind_direction: 318,
      wind_speed: 2.55,
    },
    {
      datetime: TODAY.add(6, 'day')
        .add(11, 'hour')
        .toISOString(),
      humidity: 60,
      pressure: 1010,
      temperature_max: 7,
      temperature_min: 3,
      units: 'metric',
      weather: 'rain',
      wind_direction: 96,
      wind_speed: 0.98,
    },
  ],
};

const fakeHouses = [
  {
    latitude: 112,
    longitude: -2,
    offset: 0,
    language: 'fr',
    units: 'metric',
  },
];

const openWeather = {
  weather: {
    get: fake.resolves(fakeWeather),
  },
};

const houses = {
  get: fake.resolves(fakeHouses),
};

const service = {
  getService: () => openWeather,
  stateManager: {
    getAllKeys: () => ['openweather'],
  },
};

describe('weather.command', () => {
  let messageManager;
  beforeEach(() => {
    messageManager = {
      replyByIntent: fake.resolves(true),
    };
  });

  it('should get the current weather', async () => {
    const weather = new Weather(service, event, messageManager, houses);
    const message = {
      text: 'Meteo ?',
      user: {
        language: 'fr',
        distance_unit_preference: 'metric',
      },
    };
    await weather.command(
      message,
      {
        intent: 'weather.get',
        entities: [],
      },
      {},
    );
    assert.calledWith(messageManager.replyByIntent, message, 'weather.get.success.now.cloud', {
      temperature: 54.87,
      units: '°C',
    });
  });
  it('should get the weather for today', async () => {
    const weather = new Weather(service, event, messageManager, houses);
    const message = {
      text: 'Meteo Today?',
      user: {
        language: 'fr',
        distance_unit_preference: 'metric',
      },
    };
    await weather.command(
      message,
      {
        intent: 'weather.get',
        entities: [
          {
            entity: 'date',
            resolution: {
              type: 'date',
              date: TODAY.toDate(),
            },
          },
        ],
      },
      {},
    );
    assert.calledWith(messageManager.replyByIntent, message, 'weather.get.success.today.rain', {
      temperature_max: 11,
      temperature_min: 6,
      units: '°C',
    });
  });
  it('should get the weather for tomorrow', async () => {
    const weather = new Weather(service, event, messageManager, houses);
    const message = {
      text: 'Meteo Tomorrow?',
      user: {
        language: 'fr',
        distance_unit_preference: 'metric',
      },
    };
    await weather.command(
      message,
      {
        intent: 'weather.get',
        entities: [
          {
            entity: 'date',
            resolution: {
              type: 'date',
              date: TODAY.add(1, 'day').toDate(),
            },
          },
        ],
      },
      {},
    );
    assert.calledWith(messageManager.replyByIntent, message, 'weather.get.success.tomorrow.clear', {
      temperature_max: 9,
      temperature_min: 4,
      units: '°C',
    });
  });
  it('should get the weather for tomorrow from a provider whose days start tomorrow', async () => {
    // the pivot weather format does not guarantee that days[0] is today:
    // a provider returning only future days must not answer off-by-one
    const futureOnlyWeather = {
      ...fakeWeather,
      days: fakeWeather.days.slice(1),
    };
    const futureOnlyService = {
      getService: () => ({ weather: { get: fake.resolves(futureOnlyWeather) } }),
      stateManager: {
        getAllKeys: () => ['openweather'],
      },
    };
    const weather = new Weather(futureOnlyService, event, messageManager, houses);
    const message = {
      text: 'Meteo Tomorrow?',
      user: {
        language: 'fr',
        distance_unit_preference: 'metric',
      },
    };
    await weather.command(
      message,
      {
        intent: 'weather.get',
        entities: [
          {
            entity: 'date',
            resolution: {
              type: 'date',
              date: TODAY.add(1, 'day').toDate(),
            },
          },
        ],
      },
      {},
    );
    assert.calledWith(messageManager.replyByIntent, message, 'weather.get.success.tomorrow.clear', {
      temperature_max: 9,
      temperature_min: 4,
      units: '°C',
    });
  });
  it('should get the weather for after tomorrow', async () => {
    const weather = new Weather(service, event, messageManager, houses);
    const message = {
      text: 'Meteo After Tomorrow?',
      user: {
        language: 'fr',
        distance_unit_preference: 'metric',
      },
    };
    await weather.command(
      message,
      {
        intent: 'weather.get',
        entities: [
          {
            entity: 'date',
            resolution: {
              type: 'date',
              date: TODAY.add(2, 'days').toDate(),
            },
          },
        ],
      },
      {},
    );
    assert.calledWith(messageManager.replyByIntent, message, 'weather.get.success.after-tomorrow.cloud', {
      temperature_max: 9,
      temperature_min: 5,
      units: '°C',
    });
  });

  it('should get the weather for next sunday', async () => {
    const weather = new Weather(service, event, messageManager, houses);
    const message = {
      text: 'Meteo next sunday?',
      user: {
        language: 'fr',
        distance_unit_preference: 'metric',
      },
    };
    await weather.command(
      message,
      {
        intent: 'weather.get',
        entities: [
          {
            entity: 'date',
            sourceText: 'sunday',
            resolution: {
              type: 'interval',
              strFutureValue: TODAY.add(4, 'days').toDate(),
            },
          },
        ],
      },
      {},
    );
    assert.calledWith(messageManager.replyByIntent, message, 'weather.get.success.day.rain', {
      day: 'Sunday',
      temperature_max: 6,
      temperature_min: 5,
      units: '°C',
    });
  });
  it("shouldn't get the weather for a day from a provider without daily forecast", async () => {
    const { days, ...noDaysWeather } = fakeWeather;
    const noDaysService = {
      getService: () => ({ weather: { get: fake.resolves(noDaysWeather) } }),
      stateManager: {
        getAllKeys: () => ['openweather'],
      },
    };
    const weather = new Weather(noDaysService, event, messageManager, houses);
    const message = {
      text: 'Meteo Tomorrow?',
      user: {
        language: 'fr',
        distance_unit_preference: 'metric',
      },
    };
    await weather.command(
      message,
      {
        intent: 'weather.get',
        entities: [
          {
            entity: 'date',
            resolution: {
              type: 'date',
              date: TODAY.add(1, 'day').toDate(),
            },
          },
        ],
      },
      {},
    );
    assert.calledWith(messageManager.replyByIntent, message, 'weather.get.fail.no-weather', {});
  });
  it("shouldn't get the weather without day", async () => {
    const weather = new Weather(service, event, messageManager, houses);
    const message = {
      text: 'Meteo next?',
      user: {
        language: 'fr',
        distance_unit_preference: 'metric',
      },
    };
    await weather.command(
      message,
      {
        intent: 'weather.get',
        entities: [],
      },
      {},
    );
    assert.calledWith(messageManager.replyByIntent, message, 'weather.get.success.now.cloud', {
      temperature: 54.87,
      units: '°C',
    });
  });
  it("shouldn't get the weather with a too far day", async () => {
    const weather = new Weather(service, event, messageManager, houses);
    const message = {
      text: 'Meteo next far day?',
      user: {
        language: 'fr',
        distance_unit_preference: 'metric',
      },
    };
    await weather.command(
      message,
      {
        intent: 'weather.get',
        entities: [
          {
            entity: 'date',
            sourceText: 'sunday',
            resolution: {
              type: 'interval',
              strFutureValue: TODAY.add(30, 'days').toDate(),
            },
          },
        ],
      },
      {},
    );
    assert.calledWith(messageManager.replyByIntent, message, 'weather.get.fail.no-weather', {});
  });
});
