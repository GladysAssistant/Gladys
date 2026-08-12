const { expect } = require('chai');

const {
  formatWeather,
  MAX_HOURS,
  MAX_DAYS,
  MAX_ALERTS,
  MAX_ALERT_DESCRIPTION_CHARS,
} = require('../../../../services/mcp/lib/formatWeather');

describe('formatWeather', () => {
  it('should format a full pivot weather payload in the home timezone', () => {
    const formatted = formatWeather(
      {
        temperature: 27.28,
        apparent_temperature: 29.123,
        humidity: 58,
        pressure: 1005.98,
        dew_point: 18.4,
        wind_speed: 5.06,
        wind_direction: 210,
        wind_gust: 12.4,
        visibility: 10,
        cloud_cover: 20,
        uv_index: 6,
        is_day: true,
        sunrise: '2026-08-12T04:30:00.000Z',
        sunset: '2026-08-12T19:20:00.000Z',
        datetime: '2026-08-12T12:00:00.000Z',
        units: 'metric',
        weather: 'clear',
        hours: [
          {
            datetime: '2026-08-12T13:00:00.000Z',
            weather: 'cloud',
            temperature: 26.5,
            precipitation: 0.2,
            precipitation_probability: 30,
            wind_speed: 4.2,
          },
        ],
        days: [
          {
            datetime: '2026-08-13T00:00:00.000Z',
            weather: 'rain',
            temperature_min: 17.2,
            temperature_max: 24.8,
            precipitation: 5.4,
            precipitation_probability: 80,
            sunrise: '2026-08-13T04:31:00.000Z',
            sunset: '2026-08-13T19:18:00.000Z',
          },
        ],
        alerts: [
          {
            severity: 'severe',
            event: 'Orages violents',
            type: 'thunderstorm',
            start: '2026-08-13T14:00:00.000Z',
            end: '2026-08-13T22:00:00.000Z',
            description: 'Orages violents accompagnés de grêle.',
          },
        ],
      },
      { house: 'Maison', timezone: 'Europe/Paris' },
    );

    expect(formatted).to.deep.equal({
      house: 'Maison',
      timezone: 'Europe/Paris',
      units: 'metric',
      temperature_unit: '°C',
      wind_speed_unit: 'm/s',
      precipitation_unit: 'mm',
      now: {
        datetime: '2026-08-12 14:00',
        weather: 'clear',
        temperature: 27.3,
        apparent_temperature: 29.1,
        humidity: 58,
        pressure: 1006,
        dew_point: 18.4,
        wind_speed: 5.1,
        wind_direction: 210,
        wind_gust: 12.4,
        visibility: 10,
        cloud_cover: 20,
        uv_index: 6,
        is_day: true,
        sunrise: '06:30',
        sunset: '21:20',
      },
      hours: [
        {
          datetime: '2026-08-12 15:00',
          weather: 'cloud',
          temperature: 26.5,
          wind_speed: 4.2,
          precipitation: 0.2,
          precipitation_probability: 30,
        },
      ],
      days: [
        {
          date: '2026-08-13',
          day_of_week: 'Thursday',
          weather: 'rain',
          temperature_min: 17.2,
          temperature_max: 24.8,
          precipitation: 5.4,
          precipitation_probability: 80,
          sunrise: '06:31',
          sunset: '21:18',
        },
      ],
      alerts: [
        {
          severity: 'severe',
          event: 'Orages violents',
          type: 'thunderstorm',
          start: '2026-08-13 16:00',
          end: '2026-08-14 00:00',
          description: 'Orages violents accompagnés de grêle.',
        },
      ],
    });
  });

  it('should keep only the fields reported by the provider', () => {
    const formatted = formatWeather(
      {
        temperature: 12,
        datetime: new Date('2026-01-05T08:00:00.000Z'),
        units: 'metric',
        weather: 'fog',
        humidity: null,
        wind_speed: undefined,
        is_day: 'yes',
        sunrise: 'not-a-date',
        hours: [{ datetime: '2026-01-05T09:00:00.000Z' }],
        days: [{ temperature_min: 3, temperature_max: 9 }],
        alerts: [{ severity: 'minor', event: 'Vent' }],
      },
      { house: 'Home', timezone: 'Europe/Paris' },
    );

    expect(formatted.now).to.deep.equal({
      datetime: '2026-01-05 09:00',
      weather: 'fog',
      temperature: 12,
    });
    expect(formatted.hours).to.deep.equal([{ datetime: '2026-01-05 10:00' }]);
    // no datetime on the day entry: no date and no weekday, only the measures
    expect(formatted.days).to.deep.equal([{ temperature_min: 3, temperature_max: 9 }]);
    expect(formatted.alerts).to.deep.equal([{ severity: 'minor', event: 'Vent' }]);
  });

  it('should omit empty lists and unparseable current conditions', () => {
    const formatted = formatWeather(
      { units: 'metric', hours: [], days: 'not-an-array' },
      { house: 'Home', timezone: 'UTC' },
    );

    expect(formatted).to.deep.equal({
      house: 'Home',
      timezone: 'UTC',
      units: 'metric',
      temperature_unit: '°C',
      wind_speed_unit: 'm/s',
      precipitation_unit: 'mm',
      now: {},
    });
  });

  it('should label imperial units and keep is_day false', () => {
    const formatted = formatWeather(
      {
        temperature: 81.5,
        datetime: '2026-08-12T23:00:00.000Z',
        units: 'imperial',
        weather: 'clear',
        is_day: false,
      },
      { house: 'Home', timezone: 'America/New_York' },
    );

    expect(formatted.units).to.equal('imperial');
    expect(formatted.temperature_unit).to.equal('°F');
    expect(formatted.wind_speed_unit).to.equal('mph');
    expect(formatted.precipitation_unit).to.equal('in');
    expect(formatted.now.datetime).to.equal('2026-08-12 19:00');
    expect(formatted.now.is_day).to.equal(false);
  });

  it('should treat an unknown unit system as metric', () => {
    const formatted = formatWeather({ temperature: 20, units: 'kelvin' }, { house: 'Home', timezone: 'UTC' });

    expect(formatted.units).to.equal('metric');
    expect(formatted.temperature_unit).to.equal('°C');
  });

  it('should cap the hourly, daily and alert lists', () => {
    const formatted = formatWeather(
      {
        temperature: 20,
        units: 'metric',
        hours: new Array(24).fill(null).map((value, index) => ({ temperature: index })),
        days: new Array(10).fill(null).map((value, index) => ({ temperature_min: index, temperature_max: index })),
        alerts: new Array(10).fill(null).map((value, index) => ({ severity: 'minor', event: `Alert ${index}` })),
      },
      { house: 'Home', timezone: 'UTC' },
    );

    expect(formatted.hours).to.have.lengthOf(MAX_HOURS);
    expect(formatted.days).to.have.lengthOf(MAX_DAYS);
    expect(formatted.alerts).to.have.lengthOf(MAX_ALERTS);
  });

  it('should truncate a long alert description', () => {
    const formatted = formatWeather(
      {
        temperature: 20,
        units: 'metric',
        alerts: [{ severity: 'extreme', event: 'Canicule', description: 'a'.repeat(MAX_ALERT_DESCRIPTION_CHARS + 50) }],
      },
      { house: 'Home', timezone: 'UTC' },
    );

    expect(formatted.alerts[0].description).to.equal(`${'a'.repeat(MAX_ALERT_DESCRIPTION_CHARS)}...`);
  });

  it('should drop an empty alert description', () => {
    const formatted = formatWeather(
      {
        temperature: 20,
        units: 'metric',
        alerts: [{ severity: 'moderate', event: 'Neige', description: '' }],
      },
      { house: 'Home', timezone: 'UTC' },
    );

    expect(formatted.alerts).to.deep.equal([{ severity: 'moderate', event: 'Neige' }]);
  });
});
