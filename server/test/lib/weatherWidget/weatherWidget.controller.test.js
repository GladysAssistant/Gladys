const { expect } = require('chai');
const { fake } = require('sinon');
const WeatherWidgetController = require('../../../api/controllers/weatherWidget.controller');
const { owCurrentData, owForecastData } = require('./weatherWidget.data');

const buildRes = () => {
  const res = {};
  res.status = fake.returns(res);
  res.json = fake.returns(null);
  return res;
};

const house = { selector: 'main-house', latitude: 46.75, longitude: 4.35 };

describe('WeatherWidgetController', () => {
  it('should return 400 when the house has no coordinates', async () => {
    const gladys = {
      house: { getBySelector: fake.resolves({ selector: 'main-house', latitude: null, longitude: null }) },
      service: { getService: fake.returns(null) },
    };
    const controller = WeatherWidgetController(gladys);
    const res = buildRes();
    await controller.getHouseOpenWeather({ params: { house_selector: 'main-house' }, user: {} }, res);
    expect(res.status.firstCall.lastArg).to.equal(400);
    expect(res.json.firstCall.lastArg).to.deep.equal({ message: 'HOUSE_HAS_NO_COORDINATES' });
  });

  it('should return 400 when the openweather service is not configured', async () => {
    const gladys = {
      house: { getBySelector: fake.resolves(house) },
      service: { getService: fake.returns(null) },
    };
    const controller = WeatherWidgetController(gladys);
    const res = buildRes();
    await controller.getHouseOpenWeather({ params: { house_selector: 'main-house' }, user: {} }, res);
    expect(res.status.firstCall.lastArg).to.equal(400);
    expect(res.json.firstCall.lastArg).to.deep.equal({ message: 'SERVICE_NOT_CONFIGURED' });
  });

  it('should return 502 when the OpenWeather API fails', async () => {
    const gladys = {
      house: { getBySelector: fake.resolves(house) },
      service: {
        getService: fake.returns({
          weather: { getRaw: fake.rejects(new Error('timeout')) },
        }),
      },
    };
    const controller = WeatherWidgetController(gladys);
    const res = buildRes();
    await controller.getHouseOpenWeather({ params: { house_selector: 'main-house' }, user: {} }, res);
    expect(res.status.firstCall.lastArg).to.equal(502);
    expect(res.json.firstCall.lastArg).to.deep.equal({ message: 'FORECAST_API_ERROR', detail: 'timeout' });
  });

  it('should return the OpenWeather forecast converted to the Météo France format', async () => {
    const getRaw = fake.resolves({ data: owCurrentData, forecastData: owForecastData });
    const gladys = {
      house: { getBySelector: fake.resolves(house) },
      service: {
        getService: fake.returns({
          weather: { getRaw },
        }),
      },
    };
    const controller = WeatherWidgetController(gladys);
    const res = buildRes();
    await controller.getHouseOpenWeather({ params: { house_selector: 'main-house' }, user: { language: 'fr' } }, res);

    expect(getRaw.firstCall.args[0]).to.deep.equal({
      latitude: house.latitude,
      longitude: house.longitude,
      language: 'fr',
    });
    const response = res.json.firstCall.lastArg;
    expect(response.source).to.equal('openweather');
    expect(response.house).to.deep.equal(house);
    expect(response.vigilance).to.deep.equal({ alerts: [], dept: null, text: '' });
    expect(response.forecast.position).to.deep.equal({ name: 'Montreal', dept: null });
  });
});
