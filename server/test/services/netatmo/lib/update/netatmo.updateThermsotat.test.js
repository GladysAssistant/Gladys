const { expect } = require('chai');
const { assert, fake } = require('sinon');
const sinon = require('sinon');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');
const NetatmoManager = require('../../../../../services/netatmo/lib/index');

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};

describe('netatmoManager updateThermostat', () => {
  const netatmoManager = new NetatmoManager(gladys, '/tmp/gladys', 'bdba9c11-8541-40a9-9c1d-82cd9402bcc3');

  beforeEach(() => {
    netatmoManager.devices = {};
    gladys.event = {
      emit: fake.returns(null),
    };
  });

  it('should success update all features NATherm1 with change value', async () => {
    const ID_TEST = '10';
    const NAME_TEST = 'Thermostat house';
    const TYPE_TEST = 'NATherm1';
    const VALUE_NUMBER_TEST = 0;
    const NEWVALUE_NUMBER_TEST = 10;
    const NEWVALUE_BOOL_TEST = true;
    const NEWVALUE_STRING_SETPOINT = 'manual';

    const device = {
      id: ID_TEST,
      model: `netatmo-${TYPE_TEST}`,
      features: [
        {
          selector: `netatmo-${ID_TEST}-temperature`,
          last_value: VALUE_NUMBER_TEST,
        },
        {
          selector: `netatmo-${ID_TEST}-battery`,
          last_value: VALUE_NUMBER_TEST,
        },
        {
          selector: `netatmo-${ID_TEST}-therm-setpoint-temperature`,
          last_value: VALUE_NUMBER_TEST,
        },
        {
          selector: `netatmo-${ID_TEST}-therm-setpoint-mode`,
          last_value: VALUE_NUMBER_TEST,
        },
        {
          selector: `netatmo-${ID_TEST}-heating-power-request`,
          last_value: VALUE_NUMBER_TEST,
        },
        {
          selector: `netatmo-${ID_TEST}-reachable`,
          last_value: VALUE_NUMBER_TEST,
        },
      ],
    };

    netatmoManager.devices = {
      [ID_TEST]: {
        id: ID_TEST,
        name: NAME_TEST,
        type: TYPE_TEST,
        fullData: {
          _id: ID_TEST,
          type: TYPE_TEST,
          battery_percent: NEWVALUE_NUMBER_TEST,
          measured: {
            temperature: NEWVALUE_NUMBER_TEST,
            setpoint_temp: NEWVALUE_NUMBER_TEST,
          },
          setpoint: {
            setpoint_mode: NEWVALUE_STRING_SETPOINT,
          },
          therm_relay_cmd: NEWVALUE_NUMBER_TEST,
        },
        homeStatus: {
          reachable: NEWVALUE_BOOL_TEST,
        },
      },
    };
    await netatmoManager.updateThermostat(ID_TEST, device, `netatmo-${ID_TEST}`);
    assert.callCount(gladys.event.emit, 12);
    assert.alwaysCalledWithMatch(gladys.event.emit, `${WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE}`, {
      device_feature_external_id: sinon.match(`netatmo:${ID_TEST}:`),
    });
  });

  it('should success update all features NRV with change value', async () => {
    const ID_TEST = '11';
    const NAME_TEST = 'Valve house';
    const TYPE_TEST = 'NRV';
    const VALUE_NUMBER_TEST = 0;
    const NEWVALUE_NUMBER_TEST = 10;
    const NEWVALUE_BOOL_TEST = true;
    const NEWVALUE_STRING_SETPOINT = 'manual';
    const NEWVALUE_STRING_BATTERY = 'very_low';

    const device = {
      id: ID_TEST,
      model: `netatmo-${TYPE_TEST}`,
      features: [
        {
          selector: `netatmo-${ID_TEST}-temperature`,
          last_value: VALUE_NUMBER_TEST,
        },
        {
          selector: `netatmo-${ID_TEST}-battery`,
          last_value: VALUE_NUMBER_TEST,
        },
        {
          selector: `netatmo-${ID_TEST}-therm-setpoint-temperature`,
          last_value: VALUE_NUMBER_TEST,
        },
        {
          selector: `netatmo-${ID_TEST}-therm-setpoint-mode`,
          last_value: VALUE_NUMBER_TEST,
        },
        {
          selector: `netatmo-${ID_TEST}-heating-power-request`,
          last_value: VALUE_NUMBER_TEST,
        },
        {
          selector: `netatmo-${ID_TEST}-reachable`,
          last_value: VALUE_NUMBER_TEST,
        },
      ],
    };

    netatmoManager.devices = {
      [ID_TEST]: {
        id: ID_TEST,
        name: NAME_TEST,
        type: TYPE_TEST,
        room: {
          therm_measured_temperature: NEWVALUE_NUMBER_TEST,
          therm_setpoint_temperature: NEWVALUE_NUMBER_TEST,
          therm_setpoint_mode: NEWVALUE_STRING_SETPOINT,
          heating_power_request: NEWVALUE_NUMBER_TEST,
        },
        homeStatus: {
          battery_state: NEWVALUE_STRING_BATTERY,
          reachable: NEWVALUE_BOOL_TEST,
        },
      },
    };
    await netatmoManager.updateThermostat(ID_TEST, device, `netatmo-${ID_TEST}`);
    assert.callCount(gladys.event.emit, 12);
    assert.alwaysCalledWithMatch(gladys.event.emit, `${WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE}`, {
      device_feature_external_id: sinon.match(`netatmo:${ID_TEST}:`),
    });
  });

  it('should fail on global type', async () => {
    const device = {};
    netatmoManager.devices = {};
    try {
      await netatmoManager.updateThermostat('10', device, 'netatmo-10');
      assert.fail();
    } catch (error) {
      expect(error.message).to.include('NETATMO : File netatmo.updateThermostat.js - error : TypeError');
    }
  });

  it('should fail NATherm1 on save values - reachable and UpperCase of setpoint_mode', async () => {
    const ID_TEST = '12';
    const NAME_TEST = 'Thermostat house';
    const TYPE_TEST = 'NATherm1';
    const VALUE_NUMBER_TEST = 0;
    const NEWVALUE_NUMBER_TEST = 10;

    const device = {
      id: ID_TEST,
      model: `netatmo-${TYPE_TEST}`,
      features: [
        {
          selector: `netatmo-${ID_TEST}-temperature`,
          last_value: VALUE_NUMBER_TEST,
        },
        {
          selector: `netatmo-${ID_TEST}-battery`,
          last_value: VALUE_NUMBER_TEST,
        },
        {
          selector: `netatmo-${ID_TEST}-therm-setpoint-temperature`,
          last_value: VALUE_NUMBER_TEST,
        },
        {
          selector: `netatmo-${ID_TEST}-therm-setpoint-mode`,
          last_value: VALUE_NUMBER_TEST,
        },
        {
          selector: `netatmo-${ID_TEST}-heating-power-request`,
          last_value: VALUE_NUMBER_TEST,
        },
        {
          selector: `netatmo-${ID_TEST}-reachable`,
          last_value: VALUE_NUMBER_TEST,
        },
      ],
    };

    netatmoManager.devices = {
      [ID_TEST]: {
        id: ID_TEST,
        name: NAME_TEST,
        type: TYPE_TEST,
        fullData: {
          _id: ID_TEST,
          type: TYPE_TEST,
          battery_percent: NEWVALUE_NUMBER_TEST,
          measured: {
            temperature: NEWVALUE_NUMBER_TEST,
            setpoint_temp: NEWVALUE_NUMBER_TEST,
          },
          setpoint: {},
          therm_relay_cmd: NEWVALUE_NUMBER_TEST,
        },
      },
    };
    await netatmoManager.updateThermostat(ID_TEST, device, `netatmo-${ID_TEST}`);
    assert.calledWith(netatmoManager.gladys.event.emit, `${EVENTS.WEBSOCKET.SEND_ALL}`, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERRORDATA,
      payload: sinon.match('reachable'),
    });
    assert.calledWith(netatmoManager.gladys.event.emit, `${EVENTS.WEBSOCKET.SEND_ALL}`, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERRORDATA,
      payload: sinon.match('toUpperCase'),
    });
    assert.neverCalledWith(netatmoManager.gladys.event.emit, `${EVENTS.WEBSOCKET.SEND_ALL}`, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERRORDATA,
      payload: sinon.match('battery_percent'),
    });
  });

  it('should fail NRV on save values - reachable, battery_state and UpperCase of setpoint_mode', async () => {
    const ID_TEST = '13';
    const NAME_TEST = 'Valve house';
    const TYPE_TEST = 'NRV';
    const VALUE_NUMBER_TEST = 0;
    const NEWVALUE_NUMBER_TEST = 10;

    const device = {
      id: ID_TEST,
      model: `netatmo-${TYPE_TEST}`,
      features: [
        {
          selector: `netatmo-${ID_TEST}-temperature`,
          last_value: VALUE_NUMBER_TEST,
        },
        {
          selector: `netatmo-${ID_TEST}-battery`,
          last_value: VALUE_NUMBER_TEST,
        },
        {
          selector: `netatmo-${ID_TEST}-therm-setpoint-temperature`,
          last_value: VALUE_NUMBER_TEST,
        },
        {
          selector: `netatmo-${ID_TEST}-therm-setpoint-mode`,
          last_value: VALUE_NUMBER_TEST,
        },
        {
          selector: `netatmo-${ID_TEST}-heating-power-request`,
          last_value: VALUE_NUMBER_TEST,
        },
        {
          selector: `netatmo-${ID_TEST}-reachable`,
          last_value: VALUE_NUMBER_TEST,
        },
      ],
    };

    netatmoManager.devices = {
      [ID_TEST]: {
        id: ID_TEST,
        name: NAME_TEST,
        type: TYPE_TEST,
        room: {
          therm_measured_temperature: NEWVALUE_NUMBER_TEST,
          therm_setpoint_temperature: NEWVALUE_NUMBER_TEST,
          heating_power_request: NEWVALUE_NUMBER_TEST,
        },
      },
    };
    await netatmoManager.updateThermostat(ID_TEST, device, `netatmo-${ID_TEST}`);
    assert.calledWith(netatmoManager.gladys.event.emit, `${EVENTS.WEBSOCKET.SEND_ALL}`, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERRORDATA,
      payload: sinon.match('reachable'),
    });
    assert.calledWith(netatmoManager.gladys.event.emit, `${EVENTS.WEBSOCKET.SEND_ALL}`, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERRORDATA,
      payload: sinon.match('battery_state'),
    });
    assert.calledWith(netatmoManager.gladys.event.emit, `${EVENTS.WEBSOCKET.SEND_ALL}`, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERRORDATA,
      payload: sinon.match('toUpperCase'),
    });
    assert.neverCalledWith(netatmoManager.gladys.event.emit, `${EVENTS.WEBSOCKET.SEND_ALL}`, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERRORDATA,
      payload: sinon.match('heating_power_request'),
    });
  });

  it('should fail on type unknown - no NATherm1 and no NRV - case "default" ', async () => {
    const ID_TEST = '14';
    const NAME_TEST = 'Thermostat house';
    const TYPE_TEST = 'NATherm2';
    const NEWVALUE_NUMBER_TEST = 10;

    const device = {};

    netatmoManager.devices = {
      [ID_TEST]: {
        id: ID_TEST,
        name: NAME_TEST,
        type: TYPE_TEST,
        room: {
          therm_measured_temperature: NEWVALUE_NUMBER_TEST,
          therm_setpoint_temperature: NEWVALUE_NUMBER_TEST,
          heating_power_request: NEWVALUE_NUMBER_TEST,
        },
      },
    };
    await netatmoManager.updateThermostat(ID_TEST, device, `netatmo-${ID_TEST}`);
    assert.calledWithExactly(netatmoManager.gladys.event.emit, `${EVENTS.WEBSOCKET.SEND_ALL}`, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERRORDATA,
      payload: sinon.match(`Error ${TYPE_TEST} ${NAME_TEST} - type unknown`),
    });
    assert.neverCalledWith(netatmoManager.gladys.event.emit, `${EVENTS.WEBSOCKET.SEND_ALL}`, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERRORDATA,
      payload: sinon.match('heating_power_request'),
    });
    assert.neverCalledWith(netatmoManager.gladys.event.emit, `${EVENTS.WEBSOCKET.SEND_ALL}`, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERRORDATA,
      payload: sinon.match("TypeError: Cannot read property 'last_value' of null"),
    });
  });
});
