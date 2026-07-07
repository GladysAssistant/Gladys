const forecastData = {
  position: {
    lat: 46.75,
    lon: 4.35,
    alti: 304,
    name: 'Charmoy',
    country: 'FR - France',
    dept: '71',
    timezone: 'Europe/Paris',
  },
  updated_on: 1783112400,
  forecast: [
    {
      dt: 1783112400,
      T: { value: 21.4, windchill: 21.1 },
      humidity: 35,
      sea_level: 1026.4,
      wind: { speed: 2, gust: 0, direction: 360, icon: 'N' },
      rain: { '1h': 0 },
      snow: { '1h': 0 },
      clouds: 10,
      weather: { icon: 'p1n', desc: 'Ciel clair' },
    },
  ],
  daily_forecast: [
    {
      dt: 1783036800,
      T: { min: 19.1, max: 29.7 },
      humidity: { min: 25, max: 75 },
      precipitation: { '24h': 0 },
      uv: 8,
      weather12H: { icon: 'p1j', desc: 'Ciel clair' },
      sun: { rise: 1783050812, set: 1783107588 },
    },
  ],
  probability_forecast: [],
};

const warningDataGreen = {
  update_time: 1783137609,
  domain_id: '71',
  color_max: 1,
  phenomenons_items: [
    { phenomenon_id: '1', phenomenon_max_color_id: 1 },
    { phenomenon_id: '3', phenomenon_max_color_id: 1 },
  ],
  text: null,
  text_avalanche: null,
};

const warningDataOrange = {
  update_time: 1783137609,
  domain_id: '71',
  color_max: 3,
  phenomenons_items: [
    { phenomenon_id: '3', phenomenon_max_color_id: 3 },
    { phenomenon_id: '6', phenomenon_max_color_id: 2 },
    { phenomenon_id: '1', phenomenon_max_color_id: 1 },
  ],
  text: {
    bloc_items: [
      {
        text_items: [
          {
            term_items: [
              {
                subdivided_text: [{ text: ['Orages violents attendus en soirée.'] }],
              },
            ],
          },
        ],
      },
    ],
  },
  text_avalanche: null,
};

// 2026-07-08 00:00 UTC, base timestamp of the OpenWeather test data
const owDay1 = Date.UTC(2026, 6, 8) / 1000;

const owCurrentData = {
  dt: owDay1 + 8 * 3600,
  name: 'Montreal',
  main: { temp: 17.3, humidity: 65, pressure: 1016 },
  wind: { speed: 2.5, deg: 0 },
  weather: [{ icon: '01d', main: 'Clear', description: 'ciel dégagé' }],
  sys: { sunrise: owDay1 + 4 * 3600, sunset: owDay1 + 19 * 3600 },
};

const owForecastData = {
  city: { name: 'Montreal', timezone: 0, sunrise: owDay1 + 4 * 3600, sunset: owDay1 + 19 * 3600 },
  list: [
    {
      dt: owDay1 + 9 * 3600,
      main: { temp: 18.2, humidity: 60, pressure: 1015 },
      wind: { speed: 3, deg: 90 },
      weather: [{ icon: '02d', description: 'quelques nuages' }],
      pop: 0.1,
    },
    {
      dt: owDay1 + 12 * 3600,
      main: { temp: 24.6, humidity: 50, pressure: 1014 },
      wind: { speed: 4, deg: 180 },
      weather: [{ icon: '01d', description: 'ciel dégagé' }],
      pop: 0,
    },
    {
      dt: owDay1 + 15 * 3600,
      main: { temp: 25.4, humidity: 45, pressure: 1013 },
      wind: { speed: 5, deg: 225 },
      weather: [{ icon: '10d', description: 'pluie légère' }],
      rain: { '3h': 1.2 },
      pop: 0.6,
    },
    {
      dt: owDay1 + 36 * 3600,
      main: { temp: 15.1, humidity: 80, pressure: 1010 },
      wind: { speed: 6, deg: 270 },
      weather: [{ icon: '09d', description: 'averses' }],
      rain: { '3h': 3.4 },
      pop: 0.9,
    },
  ],
};

module.exports = {
  forecastData,
  warningDataGreen,
  warningDataOrange,
  owDay1,
  owCurrentData,
  owForecastData,
};
