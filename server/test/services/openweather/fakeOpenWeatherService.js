const service = {
  weather: {
    get: () =>
      Promise.resolve({
        temperature: 54.87,
        humidity: 0.76,
        pressure: 1019.4,
        datetime: new Date('2019-03-28T07:50:18.000Z'),
        units: 'metric',
        wind_speed: 5.25,
        weather: 'cloud',
      }),
  },
};

module.exports = service;
