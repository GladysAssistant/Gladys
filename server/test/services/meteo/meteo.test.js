const { expect, assert } = require('chai');
const { fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const { forecastData, warningDataGreen, warningDataOrange, owCurrentData, owForecastData } = require('./meteo.data');

const SERVICE_ID = '35deac79-f295-4adf-8512-f2f48e1ea0f8';

const gladysWithoutApiKey = {
  variable: {
    getValue: () => Promise.resolve(null),
  },
  house: {
    get: () => Promise.resolve([]),
  },
  event: {
    emit: () => null,
  },
};

const gladysWithApiKey = {
  variable: {
    getValue: (name) => Promise.resolve(name === 'METEOFRANCE_API_KEY' ? 'METEOFRANCE_API_KEY_VALUE' : null),
  },
  house: {
    get: () => Promise.resolve([]),
  },
  event: {
    emit: () => null,
  },
};

const openWeatherVariables = {
  METEO_SOURCE: 'openweather',
  OPENWEATHER_API_KEY: 'OPENWEATHER_API_KEY_VALUE',
};

const gladysOpenWeatherSource = {
  variable: {
    getValue: (name) => Promise.resolve(openWeatherVariables[name] || null),
  },
  house: {
    get: () => Promise.resolve([]),
  },
  event: {
    emit: () => null,
  },
};

const openWeatherAxios = {
  axios: {
    default: {
      get: (url, config) => {
        if (!config || !config.params || config.params.appid !== 'OPENWEATHER_API_KEY_VALUE') {
          return Promise.reject(new Error(`Missing OpenWeather API key on ${url}`));
        }
        if (url.includes('openweathermap.org/data/2.5/weather')) {
          return Promise.resolve({ data: owCurrentData });
        }
        if (url.includes('openweathermap.org/data/2.5/forecast')) {
          return Promise.resolve({ data: owForecastData });
        }
        return Promise.reject(new Error(`Unexpected URL ${url}`));
      },
    },
  },
};

const workingAxios = {
  axios: {
    default: {
      get: (url) => {
        if (url.includes('/forecast')) {
          return Promise.resolve({ data: forecastData });
        }
        if (url.includes('/v3/warning/full')) {
          return Promise.resolve({ data: warningDataGreen });
        }
        if (url.includes('vignettenationale')) {
          return Promise.resolve({
            data: Buffer.from('fake-png-content'),
            headers: { 'content-type': 'image/png' },
          });
        }
        return Promise.reject(new Error(`Unexpected URL ${url}`));
      },
    },
  },
};

const brokenAxios = {
  axios: {
    default: {
      get: () => Promise.reject(new Error('broken')),
    },
  },
};

describe('MeteoService', () => {
  it('should start service without any API key', async () => {
    const MeteoService = proxyquire('../../../services/meteo/index', workingAxios);
    const meteoService = MeteoService(gladysWithoutApiKey, SERVICE_ID);
    await meteoService.start();
  });
  it('should start service with the optional API key', async () => {
    const MeteoService = proxyquire('../../../services/meteo/index', workingAxios);
    const meteoService = MeteoService(gladysWithApiKey, SERVICE_ID);
    await meteoService.start();
  });
  it('should stop service', async () => {
    const MeteoService = proxyquire('../../../services/meteo/index', workingAxios);
    const meteoService = MeteoService(gladysWithoutApiKey, SERVICE_ID);
    await meteoService.start();
    await meteoService.stop();
  });
  it('should get forecast', async () => {
    const MeteoService = proxyquire('../../../services/meteo/index', workingAxios);
    const meteoService = MeteoService(gladysWithoutApiKey, SERVICE_ID);
    const forecast = await meteoService.forecast.get(46.75, 4.35);
    expect(forecast).to.deep.equal(forecastData);
  });
  it('should retry forecast once after a failure', async () => {
    let calls = 0;
    const flakyAxios = {
      axios: {
        default: {
          get: () => {
            calls += 1;
            if (calls === 1) {
              return Promise.reject(new Error('timeout of 30000ms exceeded'));
            }
            return Promise.resolve({ data: forecastData });
          },
        },
      },
    };
    const MeteoService = proxyquire('../../../services/meteo/index', flakyAxios);
    const meteoService = MeteoService(gladysWithoutApiKey, SERVICE_ID);
    const forecast = await meteoService.forecast.get(46.75, 4.35);
    expect(calls).to.equal(2);
    expect(forecast).to.deep.equal(forecastData);
  });
  it('should reject when forecast fails twice', async () => {
    const MeteoService = proxyquire('../../../services/meteo/index', brokenAxios);
    const meteoService = MeteoService(gladysWithoutApiKey, SERVICE_ID);
    return assert.isRejected(meteoService.forecast.get(46.75, 4.35), 'broken');
  });
  it('should get vigilance warnings for a department', async () => {
    const MeteoService = proxyquire('../../../services/meteo/index', workingAxios);
    const meteoService = MeteoService(gladysWithoutApiKey, SERVICE_ID);
    const warnings = await meteoService.vigilance.get('71');
    expect(warnings).to.deep.equal(warningDataGreen);
  });
  it('should return null vigilance map without API key', async () => {
    const MeteoService = proxyquire('../../../services/meteo/index', workingAxios);
    const meteoService = MeteoService(gladysWithoutApiKey, SERVICE_ID);
    await meteoService.start();
    const image = await meteoService.vigilance.getMap();
    expect(image).to.equal(null);
  });
  it('should get vigilance state for a house, caching the department', async () => {
    let forecastCalls = 0;
    const countingAxios = {
      axios: {
        default: {
          get: (url) => {
            if (url.includes('/forecast')) {
              forecastCalls += 1;
              return Promise.resolve({ data: forecastData });
            }
            return Promise.resolve({ data: warningDataOrange });
          },
        },
      },
    };
    const MeteoService = proxyquire('../../../services/meteo/index', countingAxios);
    const meteoService = MeteoService(gladysWithoutApiKey, SERVICE_ID);
    const house = { selector: 'main-house', latitude: 46.75, longitude: 4.35 };
    const vigilance = await meteoService.vigilance.getForHouse(house);
    expect(vigilance.dept).to.equal('71');
    expect(vigilance.color).to.equal(3);
    expect(vigilance.text).to.equal('Orages violents attendus en soirée.');
    expect(vigilance.alerts).to.have.lengthOf(2);
    // Second call should reuse the cached department (no new forecast call)
    await meteoService.vigilance.getForHouse(house);
    expect(forecastCalls).to.equal(1);
  });
  it('should reject getForHouse when no department is found', async () => {
    const noDeptAxios = {
      axios: {
        default: {
          get: () => Promise.resolve({ data: { position: {} } }),
        },
      },
    };
    const MeteoService = proxyquire('../../../services/meteo/index', noDeptAxios);
    const meteoService = MeteoService(gladysWithoutApiKey, SERVICE_ID);
    const promise = meteoService.vigilance.getForHouse({ selector: 'main-house', latitude: 1, longitude: 1 });
    return assert.isRejected(promise, 'no department found');
  });
  it('should skip houses without coordinates and survive API failures during check', async () => {
    const eventEmit = fake.returns(null);
    const gladysMixedHouses = {
      variable: {
        getValue: () => Promise.resolve(null),
      },
      house: {
        get: () =>
          Promise.resolve([
            { selector: 'no-gps-house', latitude: null, longitude: null },
            { selector: 'main-house', latitude: 46.75, longitude: 4.35 },
          ]),
      },
      event: {
        emit: eventEmit,
      },
    };
    const MeteoService = proxyquire('../../../services/meteo/index', brokenAxios);
    const meteoService = MeteoService(gladysMixedHouses, SERVICE_ID);
    // Should not throw even if the API is broken
    await meteoService.vigilance.check();
    expect(eventEmit.callCount).to.equal(0);
  });
  it('should skip houses when no department can be resolved during check', async () => {
    let warningCalls = 0;
    const noDeptAxios = {
      axios: {
        default: {
          get: (url) => {
            if (url.includes('/forecast')) {
              return Promise.resolve({ data: { position: {} } });
            }
            warningCalls += 1;
            return Promise.resolve({ data: warningDataGreen });
          },
        },
      },
    };
    const eventEmit = fake.returns(null);
    const gladysWithHouse = {
      variable: {
        getValue: () => Promise.resolve(null),
      },
      house: {
        get: () => Promise.resolve([{ selector: 'main-house', latitude: 46.75, longitude: 4.35 }]),
      },
      event: {
        emit: eventEmit,
      },
    };
    const MeteoService = proxyquire('../../../services/meteo/index', noDeptAxios);
    const meteoService = MeteoService(gladysWithHouse, SERVICE_ID);
    await meteoService.vigilance.check();
    expect(warningCalls).to.equal(0);
    expect(eventEmit.callCount).to.equal(0);
  });
  it('should start without crashing when the houses cannot be fetched', async () => {
    const gladysBrokenHouse = {
      variable: {
        getValue: () => Promise.resolve(null),
      },
      house: {
        get: () => Promise.reject(new Error('DB error')),
      },
      event: {
        emit: () => null,
      },
    };
    const MeteoService = proxyquire('../../../services/meteo/index', workingAxios);
    const meteoService = MeteoService(gladysBrokenHouse, SERVICE_ID);
    await meteoService.start();
    await meteoService.stop();
  });
  it('should build a forecast summary for a house', async () => {
    const MeteoService = proxyquire('../../../services/meteo/index', workingAxios);
    const meteoService = MeteoService(gladysWithoutApiKey, SERVICE_ID);
    const summary = await meteoService.forecast.getSummaryForHouse(
      { selector: 'main-house', latitude: 46.75, longitude: 4.35 },
      2,
    );
    expect(summary.description).to.equal('Ciel clair');
    expect(summary.temp_min).to.equal(19);
    expect(summary.temp_max).to.equal(30);
    expect(summary.rain).to.equal(0);
    expect(summary.uv).to.equal(8);
    expect(summary.summary).to.contain('Ciel clair');
    expect(summary.summary).to.contain('19°/30°');
  });
  it('should fire a scene trigger when vigilance level raises, only once', async () => {
    let warningData = warningDataGreen;
    const dynamicAxios = {
      axios: {
        default: {
          get: (url) => {
            if (url.includes('/forecast')) {
              return Promise.resolve({ data: forecastData });
            }
            return Promise.resolve({ data: warningData });
          },
        },
      },
    };
    const eventEmit = fake.returns(null);
    const gladysWithHouse = {
      variable: {
        getValue: () => Promise.resolve(null),
      },
      house: {
        get: () => Promise.resolve([{ selector: 'main-house', latitude: 46.75, longitude: 4.35 }]),
      },
      event: {
        emit: eventEmit,
      },
    };
    const MeteoService = proxyquire('../../../services/meteo/index', dynamicAxios);
    const meteoService = MeteoService(gladysWithHouse, SERVICE_ID);

    // First check records the baseline (green), no event
    await meteoService.vigilance.check();
    expect(eventEmit.callCount).to.equal(0);

    // Vigilance turns orange: one event fired
    warningData = warningDataOrange;
    await meteoService.vigilance.check();
    expect(eventEmit.callCount).to.equal(1);
    expect(eventEmit.firstCall.args[0]).to.equal('trigger.check');
    expect(eventEmit.firstCall.args[1]).to.deep.include({
      type: 'meteofrance.new-vigilance',
      house: 'main-house',
      dept: '71',
      color: 3,
    });
    expect(eventEmit.firstCall.args[1].alerts).to.deep.equal([
      { dept: '71', color: 3, phenomene_id: 3, phenomene_nom: 'Orages' },
      { dept: '71', color: 2, phenomene_id: 6, phenomene_nom: 'Canicule' },
    ]);

    // Same level: no new event
    await meteoService.vigilance.check();
    expect(eventEmit.callCount).to.equal(1);

    // Back to green: no event either
    warningData = warningDataGreen;
    await meteoService.vigilance.check();
    expect(eventEmit.callCount).to.equal(1);
  });
  it('should return vigilance map as data URL with API key, using the cache', async () => {
    let calls = 0;
    const countingAxios = {
      axios: {
        default: {
          get: () => {
            calls += 1;
            return Promise.resolve({
              data: Buffer.from('fake-png-content'),
              headers: { 'content-type': 'image/png' },
            });
          },
        },
      },
    };
    const MeteoService = proxyquire('../../../services/meteo/index', countingAxios);
    const meteoService = MeteoService(gladysWithApiKey, SERVICE_ID);
    await meteoService.start();
    const image = await meteoService.vigilance.getMap();
    expect(image).to.equal(`data:image/png;base64,${Buffer.from('fake-png-content').toString('base64')}`);
    // Second call should be served from the cache
    const imageAgain = await meteoService.vigilance.getMap();
    expect(imageAgain).to.equal(image);
    expect(calls).to.equal(1);
  });
  it('should get forecast from OpenWeather when the source is openweather', async () => {
    const MeteoService = proxyquire('../../../services/meteo/index', openWeatherAxios);
    const meteoService = MeteoService(gladysOpenWeatherSource, SERVICE_ID);
    await meteoService.start();
    await meteoService.stop();
    const forecast = await meteoService.forecast.get(45.5, -73.55);
    expect(forecast.position.name).to.equal('Montreal');
    expect(forecast.position.dept).to.equal(null);
    // First entry is the current weather from the /weather endpoint
    expect(forecast.forecast[0].T.value).to.equal(17.3);
    expect(forecast.forecast[0].weather.icon).to.equal('p1j');
    expect(forecast.forecast[0].wind.icon).to.equal('N');
    // Two local days in the test forecast data
    expect(forecast.daily_forecast).to.have.lengthOf(2);
    expect(forecast.daily_forecast[0].T.min).to.equal(18.2);
    expect(forecast.daily_forecast[0].T.max).to.equal(25.4);
    expect(forecast.daily_forecast[0].weather12H.icon).to.equal('p1j');
    // Rain amounts are deliberately not exposed with the OpenWeather source
    expect(forecast.daily_forecast[0].precipitation['24h']).to.equal(null);
    expect(forecast.daily_forecast[0].sun).to.not.equal(null);
    expect(forecast.daily_forecast[1].sun).to.equal(null);
    expect(forecast.probability_forecast).to.have.lengthOf(4);
    expect(forecast.probability_forecast[2].rain['3h']).to.equal(60);
  });
  it('should reject OpenWeather forecast when no API key is configured', async () => {
    const gladysOpenWeatherNoKey = {
      variable: {
        getValue: (name) => Promise.resolve(name === 'METEO_SOURCE' ? 'openweather' : null),
      },
      house: {
        get: () => Promise.resolve([]),
      },
      event: {
        emit: () => null,
      },
    };
    const MeteoService = proxyquire('../../../services/meteo/index', openWeatherAxios);
    const meteoService = MeteoService(gladysOpenWeatherNoKey, SERVICE_ID);
    await meteoService.start();
    await meteoService.stop();
    return assert.isRejected(meteoService.forecast.get(45.5, -73.55), 'OpenWeather API key is not configured');
  });
  it('should build a forecast summary from OpenWeather data', async () => {
    const MeteoService = proxyquire('../../../services/meteo/index', openWeatherAxios);
    const meteoService = MeteoService(gladysOpenWeatherSource, SERVICE_ID);
    await meteoService.start();
    await meteoService.stop();
    const summary = await meteoService.forecast.getSummaryForHouse(
      { selector: 'main-house', latitude: 45.5, longitude: -73.55 },
      2,
    );
    expect(summary.description).to.equal('ciel dégagé');
    expect(summary.temp_min).to.equal(18);
    expect(summary.temp_max).to.equal(25);
    // No rain amounts with the OpenWeather source
    expect(summary.rain).to.equal(null);
    expect(summary.uv).to.equal(null);
    expect(summary.summary).to.contain('ciel dégagé');
    expect(summary.summary).to.contain('averses');
  });
  it('should never call Météo France with the OpenWeather source', async () => {
    let meteoFranceCalls = 0;
    const strictAxios = {
      axios: {
        default: {
          get: (url, config) => {
            if (url.includes('meteofrance')) {
              meteoFranceCalls += 1;
              return Promise.reject(new Error(`Unexpected Météo France call: ${url}`));
            }
            if (url.includes('openweathermap.org/data/2.5/weather')) {
              return Promise.resolve({ data: owCurrentData });
            }
            if (url.includes('openweathermap.org/data/2.5/forecast')) {
              return Promise.resolve({ data: owForecastData });
            }
            return Promise.reject(new Error(`Unexpected URL ${url}`));
          },
        },
      },
    };
    const gladysWithHouse = {
      variable: {
        getValue: (name) => Promise.resolve(openWeatherVariables[name] || null),
      },
      house: {
        get: () => Promise.resolve([{ selector: 'main-house', latitude: 45.5, longitude: -73.55 }]),
      },
      event: {
        emit: () => null,
      },
    };
    const MeteoService = proxyquire('../../../services/meteo/index', strictAxios);
    const meteoService = MeteoService(gladysWithHouse, SERVICE_ID);
    await meteoService.start();
    await meteoService.stop();
    // The periodic check is a no-op with the OpenWeather source
    await meteoService.vigilance.check();
    await meteoService.forecast.get(45.5, -73.55);
    expect(meteoFranceCalls).to.equal(0);
  });
  it('should reject vigilance getForHouse with the OpenWeather source', async () => {
    const MeteoService = proxyquire('../../../services/meteo/index', openWeatherAxios);
    const meteoService = MeteoService(gladysOpenWeatherSource, SERVICE_ID);
    await meteoService.start();
    await meteoService.stop();
    const promise = meteoService.vigilance.getForHouse({ selector: 'main-house', latitude: 45.5, longitude: -73.55 });
    return assert.isRejected(promise, 'vigilance is only available with the Météo France source');
  });
  it('should return null vigilance map with the OpenWeather source, even with an API key', async () => {
    const gladysOpenWeatherWithMapKey = {
      variable: {
        getValue: (name) =>
          Promise.resolve(
            name === 'METEOFRANCE_API_KEY' ? 'METEOFRANCE_API_KEY_VALUE' : openWeatherVariables[name] || null,
          ),
      },
      house: {
        get: () => Promise.resolve([]),
      },
      event: {
        emit: () => null,
      },
    };
    const MeteoService = proxyquire('../../../services/meteo/index', openWeatherAxios);
    const meteoService = MeteoService(gladysOpenWeatherWithMapKey, SERVICE_ID);
    await meteoService.start();
    await meteoService.stop();
    const image = await meteoService.vigilance.getMap();
    expect(image).to.equal(null);
  });
});
