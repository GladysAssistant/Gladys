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
  owDay1,
  owCurrentData,
  owForecastData,
};
