const { expect } = require('chai');
const {
  formatOpenWeatherAsMeteoFrance,
  convertIcon,
  degreesToCardinal,
} = require('../../../lib/weatherWidget/openweather.formatter');
const { owDay1, owCurrentData, owForecastData } = require('./weatherWidget.data');

describe('openweather.formatter', () => {
  describe('convertIcon', () => {
    it('should convert OpenWeather icon codes to Météo France codes', () => {
      expect(convertIcon('01d')).to.equal('p1j');
      expect(convertIcon('01n')).to.equal('p1n');
      expect(convertIcon('02d')).to.equal('p2j');
      expect(convertIcon('04n')).to.equal('p5n');
      expect(convertIcon('09d')).to.equal('p11j');
      expect(convertIcon('10n')).to.equal('p9n');
      expect(convertIcon('11d')).to.equal('p18j');
      expect(convertIcon('13d')).to.equal('p14j');
      expect(convertIcon('50n')).to.equal('p6n');
    });
    it('should return null for unknown or missing icons', () => {
      expect(convertIcon('99d')).to.equal(null);
      expect(convertIcon('whatever')).to.equal(null);
      expect(convertIcon(null)).to.equal(null);
    });
  });

  describe('degreesToCardinal', () => {
    it('should convert degrees to French cardinal labels', () => {
      expect(degreesToCardinal(0)).to.equal('N');
      expect(degreesToCardinal(90)).to.equal('E');
      expect(degreesToCardinal(180)).to.equal('S');
      expect(degreesToCardinal(225)).to.equal('SO');
      expect(degreesToCardinal(315)).to.equal('NO');
      expect(degreesToCardinal(350)).to.equal('N');
    });
    it('should return null when the direction is missing', () => {
      expect(degreesToCardinal(null)).to.equal(null);
      expect(degreesToCardinal(undefined)).to.equal(null);
    });
  });

  describe('formatOpenWeatherAsMeteoFrance', () => {
    it('should convert OpenWeather responses to the Météo France format', () => {
      const data = formatOpenWeatherAsMeteoFrance(owCurrentData, owForecastData);

      expect(data.position).to.deep.equal({ name: 'Montreal', dept: null });
      expect(data.updated_on).to.equal(owCurrentData.dt);

      // Hourly entries: current weather first, then the 3h slots
      expect(data.forecast).to.have.lengthOf(5);
      expect(data.forecast[0]).to.deep.equal({
        dt: owDay1 + 8 * 3600,
        T: { value: 17.3 },
        humidity: 65,
        sea_level: 1016,
        wind: { speed: 2.5, icon: 'N' },
        weather: { icon: 'p1j', desc: 'ciel dégagé' },
      });
      // Rain amounts are deliberately not exposed (unreliable 3h accumulations)
      expect(data.forecast[3].rain).to.equal(undefined);
      expect(data.forecast[3].weather.icon).to.equal('p9j');

      // Rain probability from the "pop" field
      expect(data.probability_forecast).to.deep.equal([
        { dt: owDay1 + 9 * 3600, rain: { '3h': 10 } },
        { dt: owDay1 + 12 * 3600, rain: { '3h': 0 } },
        { dt: owDay1 + 15 * 3600, rain: { '3h': 60 } },
        { dt: owDay1 + 36 * 3600, rain: { '3h': 90 } },
      ]);

      // Daily forecast grouped by local day
      expect(data.daily_forecast).to.have.lengthOf(2);
      expect(data.daily_forecast[0]).to.deep.equal({
        dt: owDay1 + 12 * 3600,
        T: { min: 18.2, max: 25.4 },
        weather12H: { icon: 'p1j', desc: 'ciel dégagé' },
        precipitation: { '24h': null },
        sun: { rise: owDay1 + 4 * 3600, set: owDay1 + 19 * 3600 },
        uv: null,
      });
      expect(data.daily_forecast[1]).to.deep.equal({
        dt: owDay1 + 36 * 3600,
        T: { min: 15.1, max: 15.1 },
        weather12H: { icon: 'p11j', desc: 'averses' },
        precipitation: { '24h': null },
        sun: null,
        uv: null,
      });
    });
    it('should group days using the city timezone', () => {
      // Same slots, but the city is at UTC-10: 09:00 UTC is 23:00 local the day before,
      // 12:00 and 15:00 UTC land on the next local day, 36h on a third one
      const shifted = { ...owForecastData, city: { ...owForecastData.city, timezone: -10 * 3600 } };
      const data = formatOpenWeatherAsMeteoFrance(owCurrentData, shifted);
      expect(data.daily_forecast).to.have.lengthOf(3);
      expect(data.daily_forecast[0].T).to.deep.equal({ min: 18.2, max: 18.2 });
      expect(data.daily_forecast[1].T).to.deep.equal({ min: 24.6, max: 25.4 });
      expect(data.daily_forecast[2].T).to.deep.equal({ min: 15.1, max: 15.1 });
    });
    it('should survive empty responses', () => {
      const data = formatOpenWeatherAsMeteoFrance(null, null);
      expect(data.position).to.deep.equal({ name: '', dept: null });
      expect(data.forecast).to.deep.equal([]);
      expect(data.daily_forecast).to.deep.equal([]);
      expect(data.probability_forecast).to.deep.equal([]);
    });
  });
});
