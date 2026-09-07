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
            apparent_temperature: 27.1,
            humidity: 55,
            pressure: 1004,
            precipitation: 0.2,
            precipitation_probability: 30,
            wind_speed: 4.2,
            wind_direction: 200,
            wind_gust: 9.6,
            cloud_cover: 40,
            uv_index: 5,
            is_day: true,
          },
        ],
        days: [
          {
            datetime: '2026-08-13T00:00:00.000Z',
            weather: 'rain',
            temperature_min: 17.2,
            temperature_max: 24.8,
            humidity: 70,
            precipitation: 5.4,
            precipitation_probability: 80,
            wind_speed: 6.1,
            wind_direction: 190,
            wind_gust: 15.2,
            uv_index: 3,
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
      visibility_unit: 'km',
      pressure_unit: 'hPa',
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
          datetime: '2026-08-12 15:00+02:00',
          weather: 'cloud',
          temperature: 26.5,
          apparent_temperature: 27.1,
          humidity: 55,
          pressure: 1004,
          wind_speed: 4.2,
          wind_direction: 200,
          wind_gust: 9.6,
          cloud_cover: 40,
          precipitation: 0.2,
          precipitation_probability: 30,
          uv_index: 5,
          is_day: true,
        },
      ],
      days: [
        {
          date: '2026-08-13',
          day_of_week: 'Thursday',
          weather: 'rain',
          temperature_min: 17.2,
          temperature_max: 24.8,
          humidity: 70,
          wind_speed: 6.1,
          wind_direction: 190,
          wind_gust: 15.2,
          precipitation: 5.4,
          precipitation_probability: 80,
          uv_index: 3,
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
    expect(formatted.hours).to.deep.equal([{ datetime: '2026-01-05 10:00+01:00' }]);
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
      visibility_unit: 'km',
      pressure_unit: 'hPa',
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
    expect(formatted.visibility_unit).to.equal('mi');
    // pressure is hPa in both unit systems
    expect(formatted.pressure_unit).to.equal('hPa');
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

  it('should keep the two repeated hours of a fall-back night apart', () => {
    const formatted = formatWeather(
      {
        temperature: 12,
        units: 'metric',
        hours: [
          // both instants read 02:00 on the Paris clock, an hour apart
          { datetime: '2025-10-26T00:00:00.000Z', temperature: 13 },
          { datetime: '2025-10-26T01:00:00.000Z', temperature: 12 },
        ],
      },
      { house: 'Home', timezone: 'Europe/Paris' },
    );

    expect(formatted.hours.map(({ datetime }) => datetime)).to.deep.equal([
      '2025-10-26 02:00+02:00',
      '2025-10-26 02:00+01:00',
    ]);
  });

  it('should render the offset of a zone that is behind UTC or off the hour', () => {
    const formatted = formatWeather(
      {
        units: 'metric',
        hours: [
          { datetime: '2026-01-05T12:00:00.000Z', temperature: 20 },
          { datetime: '2026-01-05T12:00:30.500Z', temperature: 21 },
        ],
      },
      { house: 'Home', timezone: 'America/St_Johns' },
    );

    // Newfoundland sits 3h30 behind UTC in winter, and the seconds of the
    // second entry must not shift its offset
    expect(formatted.hours.map(({ datetime }) => datetime)).to.deep.equal([
      '2026-01-05 08:30-03:30',
      '2026-01-05 08:30-03:30',
    ]);
  });

  it('should drop malformed list entries instead of failing the whole answer', () => {
    const formatted = formatWeather(
      {
        temperature: 20,
        units: 'metric',
        hours: [null, { datetime: '2026-08-12T13:00:00.000Z', temperature: 26 }, 'not-an-hour'],
        days: ['not-a-day', null, { datetime: '2026-08-13T00:00:00.000Z', temperature_min: 17, temperature_max: 24 }],
        alerts: [null, { severity: 'minor', event: 'Vent' }, 42],
      },
      { house: 'Home', timezone: 'Europe/Paris' },
    );

    expect(formatted.hours).to.deep.equal([{ datetime: '2026-08-12 15:00+02:00', temperature: 26 }]);
    expect(formatted.days).to.deep.equal([
      { date: '2026-08-13', day_of_week: 'Thursday', temperature_min: 17, temperature_max: 24 },
    ]);
    expect(formatted.alerts).to.deep.equal([{ severity: 'minor', event: 'Vent' }]);
  });

  it('should not let a malformed entry consume one of the capped slots', () => {
    const formatted = formatWeather(
      {
        units: 'metric',
        hours: [null, ...new Array(MAX_HOURS).fill(null).map((value, index) => ({ temperature: index }))],
        days: [null, ...new Array(MAX_DAYS).fill(null).map((value, index) => ({ temperature_min: index }))],
        alerts: [null, ...new Array(MAX_ALERTS).fill(null).map((value, index) => ({ event: `Alert ${index}` }))],
      },
      { house: 'Home', timezone: 'UTC' },
    );

    expect(formatted.hours).to.have.lengthOf(MAX_HOURS);
    expect(formatted.days).to.have.lengthOf(MAX_DAYS);
    expect(formatted.alerts).to.have.lengthOf(MAX_ALERTS);
  });

  it('should render the weekday names in the language of the user', () => {
    const weather = {
      temperature: 20,
      units: 'metric',
      days: [{ datetime: '2026-08-13T00:00:00.000Z', temperature_min: 17, temperature_max: 24 }],
    };

    const french = formatWeather(weather, { house: 'Home', timezone: 'Europe/Paris', language: 'fr' });
    const german = formatWeather(weather, { house: 'Home', timezone: 'Europe/Paris', language: 'de' });
    // an unknown language degrades to English instead of failing
    const unknown = formatWeather(weather, { house: 'Home', timezone: 'Europe/Paris', language: 'xx' });

    expect(french.days[0].day_of_week).to.equal('jeudi');
    expect(german.days[0].day_of_week).to.equal('Donnerstag');
    expect(unknown.days[0].day_of_week).to.equal('Thursday');
    // the calendar date stays the language-independent key of a day
    expect(french.days[0].date).to.equal('2026-08-13');
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
