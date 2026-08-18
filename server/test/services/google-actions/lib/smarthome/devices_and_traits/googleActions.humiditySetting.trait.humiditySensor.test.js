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

describe('GoogleActions Handler - humiditySetting - humidity sensor', () => {
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
          category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.PERCENT,
          min: 0,
          max: 100,
          last_value: 55.6,
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
            traits: ['action.devices.traits.HumiditySetting'],
            attributes: {
              queryOnlyHumiditySetting: true,
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

  it('should generate sensor device with an integer feature - onSync', async () => {
    device.features[0].type = DEVICE_FEATURE_TYPES.SENSOR.INTEGER;

    const result = await googleActionsHandler.onSync(body);

    expect(result.payload.devices[0].type).to.eq('action.devices.types.SENSOR');
    expect(result.payload.devices[0].traits).to.deep.eq(['action.devices.traits.HumiditySetting']);
  });

  it('should generate a temperature and humidity sensor device - onSync', async () => {
    device.features.push({
      selector: 'feature-2',
      category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      unit: DEVICE_FEATURE_UNITS.CELSIUS,
      min: -50,
      max: 100,
      last_value: 19,
      read_only: true,
    });

    const result = await googleActionsHandler.onSync(body);

    expect(result.payload.devices[0].type).to.eq('action.devices.types.SENSOR');
    expect(result.payload.devices[0].traits).to.deep.eq([
      'action.devices.traits.HumiditySetting',
      'action.devices.traits.TemperatureControl',
    ]);
    expect(result.payload.devices[0].attributes).to.deep.eq({
      queryOnlyHumiditySetting: true,
      queryOnlyTemperatureControl: true,
      temperatureUnitForUX: 'C',
      temperatureRange: {
        minThresholdCelsius: -50,
        maxThresholdCelsius: 100,
      },
    });
  });

  it('should get device value - onQuery', async () => {
    const result = await googleActionsHandler.onQuery(body);

    const expectedResult = {
      requestId: 'request-id',
      payload: {
        agentUserId: 'user-id',
        devices: {
          'device-1': {
            online: true,
            humidityAmbientPercent: 56,
          },
        },
      },
    };
    expect(result).to.deep.eq(expectedResult);

    assert.calledOnceWithExactly(gladys.stateManager.get, 'device', 'device-1');
    assert.notCalled(gladys.event.emit);
  });

  it('should return null value when the sensor has no value yet - onQuery', async () => {
    device.features[0].last_value = null;

    const result = await googleActionsHandler.onQuery(body);

    expect(result.payload.devices['device-1']).to.deep.eq({
      online: true,
      humidityAmbientPercent: null,
    });
  });
});
