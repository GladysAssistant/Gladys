const sinon = require('sinon').createSandbox();
const { expect } = require('chai');

const { assert, fake } = sinon;

const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../../../utils/constants');
const GoogleActionsHandler = require('../../../../../../services/google-actions/lib');

const serviceId = 'd1e45425-fe25-4968-ac0f-bc695d5202d9';

const body = {
  requestId: 'request-id',
  user: {
    id: 'user-id',
    selector: 'user-selector',
  },
  inputs: [
    {
      payload: {
        devices: [
          {
            id: 'device-1',
          },
        ],
      },
    },
  ],
};

describe('GoogleActions Handler - temperatureControl - temperature sensor', () => {
  let gladys;
  let device;
  let googleActionsHandler;

  beforeEach(() => {
    device = {
      name: 'Device 1',
      selector: 'device-1',
      external_id: 'device-1-external-id',
      features: [
        {
          selector: 'feature-1',
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          min: -50,
          max: 100,
          last_value: 21.34,
          read_only: true,
        },
      ],
      model: 'device-model',
      room: {
        name: 'living-room',
      },
    };

    gladys = {
      event: {
        emit: fake.resolves(null),
      },
      stateManager: {
        get: fake.returns(device),
        state: {
          device: {
            device_1: {
              get: fake.returns(device),
            },
          },
        },
      },
    };

    googleActionsHandler = new GoogleActionsHandler(gladys, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should generate sensor device - onSync', async () => {
    const result = await googleActionsHandler.onSync(body);

    const expectedResult = {
      requestId: 'request-id',
      payload: {
        agentUserId: 'user-id',
        devices: [
          {
            id: 'device-1',
            type: 'action.devices.types.SENSOR',
            traits: ['action.devices.traits.TemperatureControl'],
            attributes: {
              queryOnlyTemperatureControl: true,
              temperatureUnitForUX: 'C',
              temperatureRange: {
                minThresholdCelsius: -50,
                maxThresholdCelsius: 100,
              },
            },
            name: {
              name: 'Device 1',
            },
            deviceInfo: {
              model: 'device-model',
            },
            roomHint: 'living-room',
            willReportState: true,
          },
        ],
      },
    };
    expect(result).to.deep.eq(expectedResult);

    assert.calledOnceWithExactly(gladys.stateManager.state.device.device_1.get);
    assert.notCalled(gladys.event.emit);
  });

  it('should generate sensor device with the default temperature range - onSync', async () => {
    delete device.features[0].min;
    delete device.features[0].max;
    device.features[0].type = DEVICE_FEATURE_TYPES.SENSOR.INTEGER;

    const result = await googleActionsHandler.onSync(body);

    expect(result.payload.devices[0].type).to.eq('action.devices.types.SENSOR');
    expect(result.payload.devices[0].traits).to.deep.eq(['action.devices.traits.TemperatureControl']);
    expect(result.payload.devices[0].attributes).to.deep.eq({
      queryOnlyTemperatureControl: true,
      temperatureUnitForUX: 'C',
      temperatureRange: {
        minThresholdCelsius: -100,
        maxThresholdCelsius: 100,
      },
    });
  });

  it('should generate sensor device in fahrenheit - onSync', async () => {
    device.features[0].unit = DEVICE_FEATURE_UNITS.FAHRENHEIT;
    device.features[0].min = 32;
    device.features[0].max = 212;

    const result = await googleActionsHandler.onSync(body);

    expect(result.payload.devices[0].attributes).to.deep.eq({
      queryOnlyTemperatureControl: true,
      temperatureUnitForUX: 'F',
      temperatureRange: {
        minThresholdCelsius: 0,
        maxThresholdCelsius: 100,
      },
    });
  });

  it('should generate sensor device in kelvin - onSync', async () => {
    device.features[0].unit = DEVICE_FEATURE_UNITS.KELVIN;
    device.features[0].min = 173.15;
    device.features[0].max = 373.15;

    const result = await googleActionsHandler.onSync(body);

    expect(result.payload.devices[0].attributes).to.deep.eq({
      queryOnlyTemperatureControl: true,
      temperatureUnitForUX: 'C',
      temperatureRange: {
        minThresholdCelsius: -100,
        maxThresholdCelsius: 100,
      },
    });
  });

  it('should keep the actionable device type when a light also measures temperature - onSync', async () => {
    device.features.unshift({
      selector: 'feature-0',
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
      last_value: 1,
    });

    const result = await googleActionsHandler.onSync(body);

    expect(result.payload.devices[0].type).to.eq('action.devices.types.LIGHT');
    expect(result.payload.devices[0].traits).to.deep.eq([
      'action.devices.traits.OnOff',
      'action.devices.traits.TemperatureControl',
    ]);
  });

  it('should get device value in celsius - onQuery', async () => {
    const result = await googleActionsHandler.onQuery(body);

    const expectedResult = {
      requestId: 'request-id',
      payload: {
        agentUserId: 'user-id',
        devices: {
          'device-1': {
            online: true,
            temperatureAmbientCelsius: 21.3,
          },
        },
      },
    };
    expect(result).to.deep.eq(expectedResult);

    assert.calledOnceWithExactly(gladys.stateManager.get, 'device', 'device-1');
    assert.notCalled(gladys.event.emit);
  });

  it('should convert device value from fahrenheit - onQuery', async () => {
    device.features[0].unit = DEVICE_FEATURE_UNITS.FAHRENHEIT;
    device.features[0].last_value = 70.5;

    const result = await googleActionsHandler.onQuery(body);

    expect(result.payload.devices['device-1']).to.deep.eq({
      online: true,
      temperatureAmbientCelsius: 21.4,
    });
  });

  it('should convert device value from kelvin - onQuery', async () => {
    device.features[0].unit = DEVICE_FEATURE_UNITS.KELVIN;
    device.features[0].last_value = 294.15;

    const result = await googleActionsHandler.onQuery(body);

    expect(result.payload.devices['device-1']).to.deep.eq({
      online: true,
      temperatureAmbientCelsius: 21,
    });
  });

  it('should not send any temperature when the sensor has no value yet - onQuery', async () => {
    device.features[0].last_value = null;

    const result = await googleActionsHandler.onQuery(body);

    // The state is omitted from the JSON payload sent to Google, not sent as null.
    expect(JSON.parse(JSON.stringify(result.payload.devices['device-1']))).to.deep.eq({
      online: true,
    });
  });
});
