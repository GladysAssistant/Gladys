const { fake } = require('sinon');

const NetatmoManager = require('../../../../../services/netatmo/lib/index');

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};

describe('netatmoManager updateNHC', () => {
  it('should add value NHC (Healthy Home Coach)', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    const device = {
      id: '10',
      type: 'NHC',
      features: [
        {
          selector: 'netatmo-10-health-idx',
          last_value: 0,
        },
      ],
    };
    netatmoManager.devices = {
      '10': {
        id: '10',
        module_name: 'Home Coach',
        data_type: 'NHC',
        dashboard_data: {
          health_idx: 2,
        },
      },
    };
    netatmoManager.updateNHC('10', device, 'netatmo-10');
  });

  it('should success update NHC (Healthy Home Coach) without change value but only change date value', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    const device = {
      id: '10',
      type: 'NHC',
      features: [
        {
          selector: 'netatmo-10-health-idx',
          last_value: 2,
        },
      ],
    };
    netatmoManager.devices = {
      '10': {
        id: '10',
        module_name: 'Home Coach',
        data_type: 'NHC',
        dashboard_data: {
          health_idx: 2,
        },
      },
    };
    netatmoManager.updateNHC('10', device, 'netatmo-10');
  });

  it('should error on no value device', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    const device = {
      id: '10',
      type: 'NHC',
      features: [],
    };
    netatmoManager.devices = {
      '10': {
        id: '10',
        module_name: 'Home Coach',
        data_type: 'NHC',
        setpoint: {
          setpoint_mode: 'program',
        },
        therm_relay_cmd: 100,
      },
    };
    netatmoManager.updateNHC('10', device, 'anything');
  });
});
