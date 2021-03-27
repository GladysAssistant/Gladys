const { fake, assert } = require('sinon');
const EvenEmitter = require('events');
const dayjs = require('dayjs');
const Weather = require('../../../lib/weather');

const event = new EvenEmitter();

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
      datetime: '2020-12-04T11:00:00.000Z',
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
      datetime: '2020-12-05T11:00:00.000Z',
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
      datetime: '2020-12-06T11:00:00.000Z',
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
      datetime: '2020-12-07T11:00:00.000Z',
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
      datetime: '2020-12-08T11:00:00.000Z',
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
      datetime: '2020-12-09T11:00:00.000Z',
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
      datetime: '2020-12-10T11:00:00.000Z',
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
              date: dayjs().toDate(),
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
              date: dayjs()
                .add(1, 'day')
                .toDate(),
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
              date: dayjs()
                .add(2, 'days')
                .toDate(),
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
              strFutureValue: dayjs()
                .add(4, 'days')
                .toDate(),
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
              strFutureValue: dayjs()
                .add(30, 'days')
                .toDate(),
            },
          },
        ],
      },
      {},
    );
    assert.calledWith(messageManager.replyByIntent, message, 'weather.get.fail.no-weather', {});
  });
});
