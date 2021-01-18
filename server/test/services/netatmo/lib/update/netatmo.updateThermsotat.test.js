const { fake } = require('sinon');

const NetatmoManager = require('../../../../../services/netatmo/lib/index');

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};

describe('netatmoManager updateThermostat', () => {
  it('should add NATherm1', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    const device = {
      id: '10',
      type: 'NATherm1',
      features: [
        {
          selector: 'netatmo-10-temperature',
          last_value: 12,
        },
        {
          selector: 'netatmo-10-battery',
          last_value: 12,
        },
        {
          selector: 'netatmo-10-therm-setpoint-temperature',
          last_value: 12,
        },
        {
          selector: 'netatmo-10-therm-setpoint-mode',
          last_value: 1,
        },
        {
          selector: 'netatmo-10-heating-power-request',
          last_value: 0,
        },
      ],
    };
    netatmoManager.devices = {
      '10': {
        id: '10',
        type: 'NATherm1',
        battery_percent: '100',
        measured: {
          temperature: 10,
          setpoint_temp: 10,
        },
        setpoint: {
          setpoint_mode: 'program',
        },
        therm_relay_cmd: 100,
      },
    };
    netatmoManager.updateThermostat('10', device, 'netatmo-10');
  });

  it('should get error on type NATherm1', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    const device = {
      id: '10',
      type: 'NATherm1',
      features: [
        {
          selector: 'netatmo-10-temperature',
          last_value: 12,
        },
        {
          selector: 'netatmo-10-battery',
          last_value: 12,
        },
        {
          selector: 'netatmo-10-therm-setpoint-temperature',
          last_value: 12,
        },
        {
          selector: 'netatmo-10-therm-setpoint-mode',
          last_value: 1,
        },
        {
          selector: 'netatmo-10-heating-power-request',
          last_value: 0,
        },
      ],
    };
    netatmoManager.devices = {
      '10': {
        id: '10',
        type: 'NATherm1',
        setpoint: {
          setpoint_mode: 'program',
        },
        therm_relay_cmd: 100,
      },
    };
    netatmoManager.updateThermostat('10', device, 'netatmo-10');
  });

  it('should add NRV', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    const device = {
      id: '10',
      type: 'NRV',
      features: [
        {
          selector: 'netatmo-10-temperature',
          last_value: 12,
        },
        {
          selector: 'netatmo-10-battery',
          last_value: 12,
        },
        {
          selector: 'netatmo-10-therm-setpoint-temperature',
          last_value: 12,
        },
        {
          selector: 'netatmo-10-therm-setpoint-mode',
          last_value: 1,
        },
        {
          selector: 'netatmo-10-heating-power-request',
          last_value: 0,
        },
        {
          selector: 'netatmo-10-reachable',
          last_value: false,
        },
      ],
    };
    netatmoManager.devices = {
      '10': {
        id: '10',
        type: 'NRV',
        homeStatus: {
          battery_state: 'very_low',
          reachable: true,
        },
        room: {
          therm_measured_temperature: 25,
          therm_setpoint_temperature: 25,
          therm_setpoint_mode: 'program',
          heating_power_request: 100,
        },
      },
    };
    netatmoManager.updateThermostat('10', device, 'netatmo-10');
  });

  it('should get error on type NRV', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    const device = {
      id: '10',
      type: 'NRV',
      features: [
        {
          selector: 'netatmo-10-temperature',
          last_value: 12,
        },
        {
          selector: 'netatmo-10-battery',
          last_value: 12,
        },
        {
          selector: 'netatmo-10-therm-setpoint-temperature',
          last_value: 12,
        },
        {
          selector: 'netatmo-10-therm-setpoint-mode',
          last_value: 1,
        },
        {
          selector: 'netatmo-10-heating-power-request',
          last_value: 0,
        },
        {
          selector: 'netatmo-10-reachable',
          last_value: false,
        },
      ],
    };
    netatmoManager.devices = {
      '10': {
        id: '10',
        type: 'NRV',
        setpoint: {
          setpoint_mode: 'program',
        },
        therm_relay_cmd: 100,
      },
    };
    netatmoManager.updateThermostat('10', device, 'netatmo-10');
  });

  it('should say that there is no devices with specific key', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    const device = {
      id: '10',
      type: 'NRV',
      features: [
        {
          selector: 'netatmo-10-temperature',
          last_value: 12,
        },
        {
          selector: 'netatmo-10-battery',
          last_value: 12,
        },
        {
          selector: 'netatmo-10-therm-setpoint-temperature',
          last_value: 12,
        },
        {
          selector: 'netatmo-10-therm-setpoint-mode',
          last_value: 1,
        },
        {
          selector: 'netatmo-10-heating-power-request',
          last_value: 0,
        },
        {
          selector: 'netatmo-10-reachable',
          last_value: false,
        },
      ],
    };
    netatmoManager.updateThermostat('10', device, 'netatmo-10');
  });

  it('should error on each features (get device selector)', async () => {
    const netatmoManager = new NetatmoManager(gladys, 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');
    const device = {
      id: '10',
      type: 'NRV',
      features: [],
    };
    netatmoManager.devices = {
      '10': {
        id: '10',
        type: 'NRV',
        setpoint: {
          setpoint_mode: 'program',
        },
        therm_relay_cmd: 100,
      },
    };
    netatmoManager.updateThermostat('10', device, 'anything');
  });
});
