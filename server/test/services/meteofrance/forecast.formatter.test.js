const { expect } = require('chai');
const { buildForecastSummary } = require('../../../services/meteofrance/lib/forecast.formatter');

describe('MeteoFrance forecast formatter', () => {
  it('should fall back to hourly weather when weather12H is missing and mention rain', () => {
    const data = {
      daily_forecast: [
        {
          dt: 1783036800,
          T: { min: 15.6, max: 31 },
          precipitation: { '24h': 2.44 },
          uv: 8,
          weather12H: null,
        },
      ],
      forecast: [
        { dt: 1783036800 + 8 * 3600, weather: { icon: 'p1j', desc: 'Ensoleillé' } },
        { dt: 1783036800 + 11 * 3600, weather: { icon: 'p4j', desc: 'Ciel voilé' } },
      ],
    };
    const summary = buildForecastSummary(data, 1);
    expect(summary.description).to.equal('Ciel voilé');
    expect(summary.temp_min).to.equal(16);
    expect(summary.temp_max).to.equal(31);
    expect(summary.rain).to.equal(2.4);
    expect(summary.uv).to.equal(8);
    expect(summary.summary).to.contain('Ciel voilé, 16°/31°, pluie 2.4 mm');
  });
  it('should handle missing values with placeholders', () => {
    const summary = buildForecastSummary({ daily_forecast: [{ dt: 1783036800 }] }, 3);
    expect(summary.description).to.equal('');
    expect(summary.temp_min).to.equal(null);
    expect(summary.temp_max).to.equal(null);
    expect(summary.rain).to.equal(null);
    expect(summary.uv).to.equal(null);
    expect(summary.summary).to.contain('?°/?°');
  });
  it('should return empty values without data', () => {
    const summary = buildForecastSummary(null, 1);
    expect(summary.description).to.equal('');
    expect(summary.summary).to.equal('');
  });
});
