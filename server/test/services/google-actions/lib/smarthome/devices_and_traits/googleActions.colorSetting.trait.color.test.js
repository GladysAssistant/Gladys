const sinon = require('sinon');
const { expect } = require('chai');

const { assert, fake } = sinon;

const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, EVENTS } = require('../../../../../../utils/constants');
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
    {
      payload: {
        commands: [
          {
            devices: [{ id: 'device-1' }],
            execution: [
              {
                command: 'action.devices.commands.ColorAbsolute',
                params: {
                  color: {
                    spectrumRGB: 20,
                  },
                },
              },
            ],
          },
        ],
      },
    },
  ],
};

describe('GoogleActions Handler - onSync - color', () => {
  let gladys;
  let googleActionsHandler;

  beforeEach(() => {
    const device = {
      name: 'Device 1',
      selector: 'device-1',
      external_id: 'device-1-external-id',
      features: [
        {
          selector: 'feature-1',
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
          last_value: 73,
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

  it('should generate device - onSync', async () => {
    const result = await googleActionsHandler.onSync(body);

    const expectedResult = {
      requestId: 'request-id',
      payload: {
        agentUserId: 'user-id',
        devices: [
          {
            id: 'device-1',
            type: 'action.devices.types.LIGHT',
            traits: ['action.devices.traits.ColorSetting'],
            attributes: {
              colorModel: 'rgb',
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
    assert.calledOnce(gladys.stateManager.state.device.device_1.get);
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
            color: {
              spectrumRgb: 73,
            },
          },
        },
      },
    };
    expect(result).to.deep.eq(expectedResult);

    assert.notCalled(gladys.stateManager.state.device.device_1.get);
    assert.calledOnceWithExactly(gladys.stateManager.get, 'device', 'device-1');
    assert.notCalled(gladys.event.emit);
  });

  it('should emit Gladys event with new value - onExecute', async () => {
    const result = await googleActionsHandler.onExecute(body);

    const expectedResult = {
      requestId: 'request-id',
      payload: {
        agentUserId: 'user-id',
        commands: [
          {
            ids: ['device-1'],
            status: 'PENDING',
          },
        ],
      },
    };
    expect(result).to.deep.eq(expectedResult);

    assert.notCalled(gladys.stateManager.state.device.device_1.get);
    assert.calledOnceWithExactly(gladys.stateManager.get, 'device', 'device-1');
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      device: 'device-1',
      device_feature: 'feature-1',
      status: 'pending',
      type: 'device.set-value',
      value: 20,
    });
  });
});
