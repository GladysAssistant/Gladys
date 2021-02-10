const { fake } = require('sinon');

const NetatmoManager = require('../../../../../services/netatmo/lib/index');

const gladys = {
  event: {
    emit: fake.returns(null),
  },
  device: {},
};

describe.only('netatmoManager updateWeatherStation', () => {
  const netatmoManager = new NetatmoManager(gladys, '/tmp/gladys', 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
  it('should success update all features NAMain with change value', async () => {
    const device = {
      id: '10',
      features: [
        {
          selector: 'netatmo-10-min-temp',
          last_value: 1,
        },
        {
          selector: 'netatmo-10-max-temp',
          last_value: 10,
        },
      ],
    };
    netatmoManager.devices = {
      '10': {
        _id: '10',
        module_name: 'Weather Station',
        data_type: 'NAMain',
        dashboard_data: {
          min_temp: 2,
          max_temp: 9,
        },
        modules: [],
      },
    };
    await netatmoManager.updateWeatherStation('10', device, 'netatmo-10');
  });

  it('should success update all features NAMain without change value but only change date value', async () => {
    const device = {
      id: '10',
      features: [
        {
          selector: 'netatmo-10-min-temp',
          last_value: 15.5,
        },
        {
          selector: 'netatmo-10-max-temp',
          last_value: 25.9,
        },
      ],
    };
    netatmoManager.devices = {
      '10': {
        _id: '10',
        module_name: 'Weather Station',
        data_type: 'NAMain',
        dashboard_data: {
          min_temp: 15.5,
          max_temp: 25.9,
        },
        modules: [],
      },
    };
    await netatmoManager.updateWeatherStation('10', device, 'netatmo-10');
  });

  it('should add NAMain and failed features update on "Cannot read property last_value of null"', async () => {
    const device = {
      id: '10',
      features: [],
    };
    netatmoManager.devices = {
      '10': {
        _id: '10',
        module_name: 'Weather Station',
        data_type: 'NAMain',
        dashboard_data: {
          min_temp: 2,
          max_temp: 9,
        },
        modules: [],
      },
    };
    await netatmoManager.updateWeatherStation('10', device, 'netatmo-10');
  });

  it('should failed update features Rain on "no save in DB"', async () => {
    const device = undefined;
    netatmoManager.devices = {
      '10': {
        _id: '10',
        module_name: 'Weather Station',
        data_type: 'NAMain',
        dashboard_data: {
          min_temp: 2,
          max_temp: 9,
        },
        modules: [
          {
            module_name: 'Starks House',
            data_type: ['Rain'],
          },
        ],
      },
    };
    await netatmoManager.updateWeatherStation('10', device, 'netatmo-10');
  });

  it('should success update all features module Rain with change value', async () => {
    const device = undefined;
    const module = {
      id: '11',
      selector: 'netatmo-11',
      features: [
        {
          selector: 'netatmo-11-battery',
          last_value: 0,
        },
        {
          selector: 'netatmo-11-reachable',
          last_value: 0,
        },
        {
          selector: 'netatmo-11-rain',
          last_value: 0,
        },
        {
          selector: 'netatmo-11-sum-rain-1',
          last_value: 0,
        },
        {
          selector: 'netatmo-11-sum-rain-24',
          last_value: 0,
        },
      ],
    };
    gladys.device.getBySelector = fake.resolves(module);
    netatmoManager.devices = {
      '10': {
        _id: '10',
        module_name: 'Weather Station',
        data_type: 'NAMain',
        dashboard_data: {
          min_temp: 2,
          max_temp: 9,
        },
        modules: [
          {
            _id: '11',
            module_name: 'Starks House',
            data_type: ['Rain'],
            battery_percent: 50,
            reachable: 1,
            dashboard_data: {
              Rain: 2,
              sum_rain_1: 9,
              sum_rain_24: 9,
            },
          },
        ],
      },
    };
    await netatmoManager.updateWeatherStation('10', device, 'netatmo-10');
  });

  it('should success update all features module Rain without change value but only change date value', async () => {
    const device = undefined;
    const module = {
      id: '11',
      selector: 'netatmo-11',
      features: [
        {
          selector: 'netatmo-11-battery',
          last_value: 50,
        },
        {
          selector: 'netatmo-11-reachable',
          last_value: 1,
        },
        {
          selector: 'netatmo-11-rain',
          last_value: 10.0,
        },
        {
          selector: 'netatmo-11-sum-rain-1',
          last_value: 5,
        },
        {
          selector: 'netatmo-11-sum-rain-24',
          last_value: 20,
        },
      ],
    };
    gladys.device.getBySelector = fake.resolves(module);
    netatmoManager.devices = {
      '10': {
        _id: '10',
        module_name: 'Weather Station',
        data_type: 'NAMain',
        dashboard_data: {
          min_temp: 2,
          max_temp: 9,
        },
        modules: [
          {
            _id: '11',
            module_name: 'Starks House',
            data_type: ['Rain'],
            battery_percent: 50,
            reachable: 1,
            dashboard_data: {
              Rain: 10.0,
              sum_rain_1: 5,
              sum_rain_24: 20,
            },
          },
        ],
      },
    };
    await netatmoManager.updateWeatherStation('10', device, 'netatmo-10');
  });

  it('should success update all features module Wind with change value', async () => {
    const device = undefined;
    const module = {
      id: '12',
      selector: 'netatmo-12',
      features: [
        {
          selector: 'netatmo-12-battery',
          last_value: 0,
        },
        {
          selector: 'netatmo-12-reachable',
          last_value: 0,
        },
        {
          selector: 'netatmo-12-windstrength',
          last_value: 0,
        },
        {
          selector: 'netatmo-12-windangle',
          last_value: 0,
        },
        {
          selector: 'netatmo-12-guststrength',
          last_value: 0,
        },
        {
          selector: 'netatmo-12-gustangle',
          last_value: 0,
        },
        {
          selector: 'netatmo-12-max-wind-str',
          last_value: 0,
        },
        {
          selector: 'netatmo-12-max-wind-angle',
          last_value: 0,
        },
      ],
    };
    gladys.device.getBySelector = fake.resolves(module);
    netatmoManager.devices = {
      '10': {
        _id: '10',
        module_name: 'Weather Station',
        data_type: 'NAMain',
        dashboard_data: {
          min_temp: 2,
          max_temp: 9,
        },
        modules: [
          {
            _id: '12',
            module_name: 'Starks House',
            data_type: ['Wind'],
            battery_percent: 50,
            reachable: 1,
            dashboard_data: {
              WindStrength: 2,
              WindAngle: 9,
              GustStrength: 9,
              GustAngle: 9,
              max_wind_str: 9,
              max_wind_angle: 9,
            },
          },
        ],
      },
    };
    await netatmoManager.updateWeatherStation('10', device, 'netatmo-10');
  });

  it('should success update all features module Wind without change value but only change date value', async () => {
    const device = undefined;
    const module = {
      id: '12',
      selector: 'netatmo-12',
      features: [
        {
          selector: 'netatmo-12-battery',
          last_value: 50,
        },
        {
          selector: 'netatmo-12-reachable',
          last_value: 1,
        },
        {
          selector: 'netatmo-12-windstrength',
          last_value: 10.1,
        },
        {
          selector: 'netatmo-12-windangle',
          last_value: 280,
        },
        {
          selector: 'netatmo-12-guststrength',
          last_value: 10.1,
        },
        {
          selector: 'netatmo-12-gustangle',
          last_value: 280,
        },
        {
          selector: 'netatmo-12-max-wind-str',
          last_value: 10.1,
        },
        {
          selector: 'netatmo-12-max-wind-angle',
          last_value: 280,
        },
      ],
    };
    gladys.device.getBySelector = fake.resolves(module);
    netatmoManager.devices = {
      '10': {
        _id: '10',
        module_name: 'Weather Station',
        data_type: 'NAMain',
        dashboard_data: {
          min_temp: 2,
          max_temp: 9,
        },
        modules: [
          {
            _id: '12',
            module_name: 'Starks House',
            data_type: ['Wind'],
            battery_percent: 50,
            reachable: 1,
            dashboard_data: {
              WindStrength: 10.1,
              WindAngle: 280,
              GustStrength: 10.1,
              GustAngle: 280,
              max_wind_str: 10.1,
              max_wind_angle: 280,
            },
          },
        ],
      },
    };
    await netatmoManager.updateWeatherStation('10', device, 'netatmo-10');
  });

  it('should success update all features module Outdoor sensor with change value', async () => {
    const device = undefined;
    const module = {
      id: '13',
      selector: 'netatmo-13',
      features: [
        {
          selector: 'netatmo-13-battery',
          last_value: 0,
        },
        {
          selector: 'netatmo-13-reachable',
          last_value: 0,
        },
        {
          selector: 'netatmo-13-temperature',
          last_value: 0,
        },
        {
          selector: 'netatmo-13-humidity',
          last_value: 0,
        },
        {
          selector: 'netatmo-13-min-temp',
          last_value: 0,
        },
        {
          selector: 'netatmo-13-max-temp',
          last_value: 0,
        },
      ],
    };
    gladys.device.getBySelector = fake.resolves(module);
    netatmoManager.devices = {
      '10': {
        _id: '10',
        module_name: 'Weather Station',
        data_type: 'NAMain',
        dashboard_data: {
          min_temp: 2,
          max_temp: 9,
        },
        modules: [
          {
            _id: '13',
            module_name: 'Starks House',
            data_type: ['Temperature', 'Humidity'],
            battery_percent: 50,
            reachable: 1,
            dashboard_data: {
              Temperature: 2,
              Humidity: 9,
              min_temp: 9,
              max_temp: 9,
            },
          },
        ],
      },
    };
    await netatmoManager.updateWeatherStation('10', device, 'netatmo-10');
  });

  it('should success update all features module Outdoor sensor without change value but only change date value', async () => {
    const device = undefined;
    const module = {
      id: '13',
      selector: 'netatmo-13',
      features: [
        {
          selector: 'netatmo-13-battery',
          last_value: 50,
        },
        {
          selector: 'netatmo-13-reachable',
          last_value: 1,
        },
        {
          selector: 'netatmo-13-temperature',
          last_value: 10.1,
        },
        {
          selector: 'netatmo-13-humidity',
          last_value: 56,
        },
        {
          selector: 'netatmo-13-min-temp',
          last_value: 10.1,
        },
        {
          selector: 'netatmo-13-max-temp',
          last_value: 10.1,
        },
      ],
    };
    gladys.device.getBySelector = fake.resolves(module);
    netatmoManager.devices = {
      '10': {
        _id: '10',
        module_name: 'Weather Station',
        data_type: 'NAMain',
        dashboard_data: {
          min_temp: 2,
          max_temp: 9,
        },
        modules: [
          {
            _id: '13',
            module_name: 'Starks House',
            data_type: ['Temperature', 'Humidity'],
            battery_percent: 50,
            reachable: 1,
            dashboard_data: {
              Temperature: 10.1,
              Humidity: 56,
              min_temp: 10.1,
              max_temp: 10.1,
            },
          },
        ],
      },
    };
    await netatmoManager.updateWeatherStation('10', device, 'netatmo-10');
  });

  it('should success update all features module Indoor sensor with change value', async () => {
    const device = undefined;
    const module = {
      id: '14',
      selector: 'netatmo-14',
      features: [
        {
          selector: 'netatmo-14-battery',
          last_value: 0,
        },
        {
          selector: 'netatmo-14-reachable',
          last_value: 0,
        },
        {
          selector: 'netatmo-14-temperature',
          last_value: 0,
        },
        {
          selector: 'netatmo-14-humidity',
          last_value: 0,
        },
        {
          selector: 'netatmo-14-min-temp',
          last_value: 0,
        },
        {
          selector: 'netatmo-14-max-temp',
          last_value: 0,
        },
        {
          selector: 'netatmo-14-co2',
          last_value: 0,
        },
      ],
    };
    gladys.device.getBySelector = fake.resolves(module);
    netatmoManager.devices = {
      '10': {
        _id: '10',
        module_name: 'Weather Station',
        data_type: 'NAMain',
        dashboard_data: {
          min_temp: 2,
          max_temp: 9,
        },
        modules: [
          {
            _id: '14',
            module_name: 'Starks House',
            data_type: ['Temperature', 'Humidity', 'CO2'],
            battery_percent: 50,
            reachable: 1,
            dashboard_data: {
              Temperature: 2,
              Humidity: 9,
              min_temp: 9,
              max_temp: 9,
              CO2: 9,
            },
          },
        ],
      },
    };
    await netatmoManager.updateWeatherStation('10', device, 'netatmo-10');
  });

  it('should success update all features module Indoor sensor without change value but only change date value', async () => {
    const device = undefined;
    const module = {
      id: '14',
      selector: 'netatmo-14',
      features: [
        {
          selector: 'netatmo-14-battery',
          last_value: 50,
        },
        {
          selector: 'netatmo-14-reachable',
          last_value: 1,
        },
        {
          selector: 'netatmo-14-temperature',
          last_value: 10.1,
        },
        {
          selector: 'netatmo-14-humidity',
          last_value: 56,
        },
        {
          selector: 'netatmo-14-min-temp',
          last_value: 10.1,
        },
        {
          selector: 'netatmo-14-max-temp',
          last_value: 10.1,
        },
        {
          selector: 'netatmo-14-co2',
          last_value: 900,
        },
      ],
    };
    gladys.device.getBySelector = fake.resolves(module);
    netatmoManager.devices = {
      '10': {
        _id: '10',
        module_name: 'Weather Station',
        data_type: 'NAMain',
        dashboard_data: {
          min_temp: 2,
          max_temp: 9,
        },
        modules: [
          {
            _id: '14',
            module_name: 'Starks House',
            data_type: ['Temperature', 'Humidity', 'CO2'],
            battery_percent: 50,
            reachable: 1,
            dashboard_data: {
              Temperature: 10.1,
              Humidity: 56,
              min_temp: 10.1,
              max_temp: 10.1,
              CO2: 900,
            },
          },
        ],
      },
    };
    await netatmoManager.updateWeatherStation('10', device, 'netatmo-10');
  });

  it('should error on each data_type module with no values', async () => {
    const device = undefined;
    const module = {
      id: '13',
      selector: 'netatmo-13',
    };
    gladys.device.getBySelector = fake.resolves(module);
    netatmoManager.devices = {
      '10': {
        _id: '10',
        module_name: 'Weather Station',
        data_type: 'NAMain',
        dashboard_data: {
          min_temp: 2,
          max_temp: 9,
        },
        modules: [
          {
            _id: '11',
            module_name: 'Starks House',
            data_type: ['Rain'],
            battery_percent: 50,
            reachable: 1,
            dashboard_data: {
              Rain: 2,
              sum_rain_1: 9,
              sum_rain_24: 9,
            },
          },
          {
            _id: '12',
            module_name: 'Starks House',
            data_type: ['Wind'],
            battery_percent: 50,
            reachable: 1,
            dashboard_data: {
              WindStrength: 2,
              WindAngle: 9,
              GustStrength: 9,
              GustAngle: 9,
              max_wind_str: 9,
              max_wind_angle: 9,
            },
          },
          {
            _id: '13',
            module_name: 'Starks House',
            data_type: ['Temperature', 'Humidity'],
            battery_percent: 50,
            reachable: 1,
            dashboard_data: {
              Temperature: 2,
              Humidity: 9,
              min_temp: 9,
              max_temp: 9,
            },
          },
          {
            _id: '14',
            module_name: 'Starks House',
            data_type: ['Temperature', 'Humidity', 'CO2'],
            battery_percent: 50,
            reachable: 1,
            dashboard_data: {
              Temperature: 2,
              Humidity: 9,
              min_temp: 9,
              max_temp: 9,
              CO2: 9,
            },
          },
        ],
      },
    };
    await netatmoManager.updateWeatherStation('10', device, 'netatmo-10');
  });

  it('should error no dashboard_data on each module with no values', async () => {
    const device = undefined;
    const module = {
      id: '13',
      selector: 'netatmo-13',
      features: [
        {
          selector: 'netatmo-11-battery',
          last_value: 0,
        },
        {
          selector: 'netatmo-11-reachable',
          last_value: 0,
        },
        {
          selector: 'netatmo-12-battery',
          last_value: 0,
        },
        {
          selector: 'netatmo-12-reachable',
          last_value: 0,
        },
        {
          selector: 'netatmo-13-battery',
          last_value: 0,
        },
        {
          selector: 'netatmo-13-reachable',
          last_value: 0,
        },
        {
          selector: 'netatmo-14-battery',
          last_value: 0,
        },
        {
          selector: 'netatmo-14-reachable',
          last_value: 0,
        },
      ],
    };
    gladys.device.getBySelector = fake.resolves(module);
    netatmoManager.devices = {
      '10': {
        _id: '10',
        module_name: 'Weather Station',
        data_type: 'NAMain',
        dashboard_data: {
          min_temp: 2,
          max_temp: 9,
        },
        modules: [
          {
            _id: '11',
            module_name: 'Starks House',
            data_type: ['Rain'],
            battery_percent: 50,
            reachable: 1,
          },
          {
            _id: '12',
            module_name: 'Starks House',
            data_type: ['Wind'],
            battery_percent: 50,
            reachable: 1,
          },
          {
            _id: '13',
            module_name: 'Starks House',
            data_type: ['Temperature', 'Humidity'],
            battery_percent: 50,
            reachable: 1,
          },
          {
            _id: '14',
            module_name: 'Starks House',
            data_type: ['Temperature', 'Humidity', 'CO2'],
            battery_percent: 50,
            reachable: 1,
          },
        ],
      },
    };
    await netatmoManager.updateWeatherStation('10', device, 'netatmo-10');
  });

  it('should failed global module of NAMain on "Cannot read property forEach of undefined"', async () => {
    const device = {
      id: '10',
      features: [
        {
          selector: 'netatmo-10-min-temp',
          last_value: 1,
        },
        {
          selector: 'netatmo-10-max-temp',
          last_value: 10,
        },
      ],
    };
    netatmoManager.devices = {
      '10': {
        _id: '10',
        module_name: 'Weather Station',
        data_type: 'NAMain',
        dashboard_data: {
          min_temp: 2,
          max_temp: 9,
        },
      },
    };
    await netatmoManager.updateWeatherStation('10', device, 'netatmo-10');
  });

  it('should error no dashboard_data on NAMain', async () => {
    const device = {
      id: '10',
      selector: 'netatmo-10',
    };
    netatmoManager.devices = {
      '10': {
        _id: '10',
        module_name: 'Weather Station',
        data_type: 'NAMain',
      },
    };
    await netatmoManager.updateWeatherStation('10', device, 'netatmo-10');
  });
});
