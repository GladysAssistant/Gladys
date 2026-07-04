const { expect, assert } = require('chai');
const { fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const { forecastData, warningDataGreen, warningDataOrange } = require('./meteofrance.data');

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
    getValue: () => Promise.resolve('METEOFRANCE_API_KEY_VALUE'),
  },
  house: {
    get: () => Promise.resolve([]),
  },
  event: {
    emit: () => null,
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

describe('MeteoFranceService', () => {
  it('should start service without any API key', async () => {
    const MeteoFranceService = proxyquire('../../../services/meteofrance/index', workingAxios);
    const meteoFranceService = MeteoFranceService(gladysWithoutApiKey, SERVICE_ID);
    await meteoFranceService.start();
  });
  it('should start service with the optional API key', async () => {
    const MeteoFranceService = proxyquire('../../../services/meteofrance/index', workingAxios);
    const meteoFranceService = MeteoFranceService(gladysWithApiKey, SERVICE_ID);
    await meteoFranceService.start();
  });
  it('should stop service', async () => {
    const MeteoFranceService = proxyquire('../../../services/meteofrance/index', workingAxios);
    const meteoFranceService = MeteoFranceService(gladysWithoutApiKey, SERVICE_ID);
    await meteoFranceService.start();
    await meteoFranceService.stop();
  });
  it('should get forecast', async () => {
    const MeteoFranceService = proxyquire('../../../services/meteofrance/index', workingAxios);
    const meteoFranceService = MeteoFranceService(gladysWithoutApiKey, SERVICE_ID);
    const forecast = await meteoFranceService.forecast.get(46.75, 4.35);
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
    const MeteoFranceService = proxyquire('../../../services/meteofrance/index', flakyAxios);
    const meteoFranceService = MeteoFranceService(gladysWithoutApiKey, SERVICE_ID);
    const forecast = await meteoFranceService.forecast.get(46.75, 4.35);
    expect(calls).to.equal(2);
    expect(forecast).to.deep.equal(forecastData);
  });
  it('should reject when forecast fails twice', async () => {
    const MeteoFranceService = proxyquire('../../../services/meteofrance/index', brokenAxios);
    const meteoFranceService = MeteoFranceService(gladysWithoutApiKey, SERVICE_ID);
    return assert.isRejected(meteoFranceService.forecast.get(46.75, 4.35), 'broken');
  });
  it('should get vigilance warnings for a department', async () => {
    const MeteoFranceService = proxyquire('../../../services/meteofrance/index', workingAxios);
    const meteoFranceService = MeteoFranceService(gladysWithoutApiKey, SERVICE_ID);
    const warnings = await meteoFranceService.vigilance.get('71');
    expect(warnings).to.deep.equal(warningDataGreen);
  });
  it('should return null vigilance map without API key', async () => {
    const MeteoFranceService = proxyquire('../../../services/meteofrance/index', workingAxios);
    const meteoFranceService = MeteoFranceService(gladysWithoutApiKey, SERVICE_ID);
    await meteoFranceService.start();
    const image = await meteoFranceService.vigilance.getMap();
    expect(image).to.equal(null);
  });
  it('should build a forecast summary for a house', async () => {
    const MeteoFranceService = proxyquire('../../../services/meteofrance/index', workingAxios);
    const meteoFranceService = MeteoFranceService(gladysWithoutApiKey, SERVICE_ID);
    const summary = await meteoFranceService.forecast.getSummaryForHouse(
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
    const MeteoFranceService = proxyquire('../../../services/meteofrance/index', dynamicAxios);
    const meteoFranceService = MeteoFranceService(gladysWithHouse, SERVICE_ID);

    // First check records the baseline (green), no event
    await meteoFranceService.vigilance.check();
    expect(eventEmit.callCount).to.equal(0);

    // Vigilance turns orange: one event fired
    warningData = warningDataOrange;
    await meteoFranceService.vigilance.check();
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
    await meteoFranceService.vigilance.check();
    expect(eventEmit.callCount).to.equal(1);

    // Back to green: no event either
    warningData = warningDataGreen;
    await meteoFranceService.vigilance.check();
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
    const MeteoFranceService = proxyquire('../../../services/meteofrance/index', countingAxios);
    const meteoFranceService = MeteoFranceService(gladysWithApiKey, SERVICE_ID);
    await meteoFranceService.start();
    const image = await meteoFranceService.vigilance.getMap();
    expect(image).to.equal(`data:image/png;base64,${Buffer.from('fake-png-content').toString('base64')}`);
    // Second call should be served from the cache
    const imageAgain = await meteoFranceService.vigilance.getMap();
    expect(imageAgain).to.equal(image);
    expect(calls).to.equal(1);
  });
});
