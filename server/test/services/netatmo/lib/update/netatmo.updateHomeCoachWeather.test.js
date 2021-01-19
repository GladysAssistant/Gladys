const { fake } = require('sinon');

const NetatmoManager = require('../../../../../services/netatmo/lib/index');

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};

describe('netatmoManager updateHomeCoachWeather', () => {
  it('should add values NHC or NAMain', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    const device = {
      id: '10',
      name: 'Home Coach Sark bedroom',
      type: 'NHC',
      features: [
        {
          selector: 'netatmo-10-temperature',
          last_value: 0,
        },
        {
          selector: 'netatmo-10-humidity',
          last_value: 0,
        },
        {
          selector: 'netatmo-10-co2',
          last_value: 0,
        },
        {
          selector: 'netatmo-10-pressure',
          last_value: 0,
        },
        {
          selector: 'netatmo-10-absolutepressure',
          last_value: 0,
        },
        {
          selector: 'netatmo-10-noise',
          last_value: 0,
        },
        {
          selector: 'netatmo-10-reachable',
          last_value: 0,
        },
      ],
    };
    netatmoManager.devices = {
      '10': {
        _id: '10',
        module_name: 'Home Coach Sark bedroom',
        dashboard_data: {
          Temperature: 10,
          Humidity: 10,
          CO2: 10,
          Pressure: 10,
          AbsolutePressure: 10,
          Noise: 10,
          reachable: 10,
        },
      },
    };
    netatmoManager.updateHomeCoachWeather('10', device, 'netatmo-10');
  });

  it('should error no last_value on device NHC or NAMain', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    const device = {
      id: '10',
      name: 'Home Coach Sark bedroom',
    };
    netatmoManager.devices = {
      '10': {
        _id: '10',
        module_name: 'Home Coach Sark bedroom',
        dashboard_data: {
          Temperature: 10,
          Humidity: 10,
          CO2: 10,
          Pressure: 10,
          AbsolutePressure: 10,
          Noise: 10,
          reachable: 10,
        },
      },
    };
    netatmoManager.updateHomeCoachWeather('10', device, 'netatmo-10');
  });

  it('should error no dashboard_data on NHC or NAMain', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    const device = {
      id: '10',
      name: 'Home Coach Sark bedroom',
      type: 'NHC',
      features: [
        {
          selector: 'netatmo-10-temperature',
          last_value: 0,
        },
        {
          selector: 'netatmo-10-humidity',
          last_value: 0,
        },
        {
          selector: 'netatmo-10-co2',
          last_value: 0,
        },
        {
          selector: 'netatmo-10-pressure',
          last_value: 0,
        },
        {
          selector: 'netatmo-10-absolutepressure',
          last_value: 0,
        },
        {
          selector: 'netatmo-10-noise',
          last_value: 0,
        },
        {
          selector: 'netatmo-10-reachable',
          last_value: 0,
        },
      ],
    };
    netatmoManager.devices = {
      '10': {
        _id: '10',
        module_name: 'Home Coach Sark bedroom',
      },
    };
    netatmoManager.updateHomeCoachWeather('10', device, 'netatmo-10');
  });
});
