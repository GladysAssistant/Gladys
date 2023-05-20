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
        commands: [
          {
            devices: [{ id: 'device-1' }],
            execution: [
              {
                command: 'action.devices.commands.OpenClose',
                params: {
                  openPercent: 73,
                  followUpToken: '123',
                },
              },
            ],
          },
        ],
      },
    },
  ],
};

describe('GoogleActions Handler - onSync - openClose - shutter', () => {
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
          category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
          type: DEVICE_FEATURE_TYPES.SHUTTER.POSITION,
          last_value: 73,
          read_only: false,
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

  it('should generate actionnable device - onSync', async () => {
    const result = await googleActionsHandler.onSync(body);

    const expectedResult = {
      requestId: 'request-id',
      payload: {
        agentUserId: 'user-id',
        devices: [
          {
            id: 'device-1',
            type: 'action.devices.types.SHUTTER',
            traits: ['action.devices.traits.OpenClose'],
            attributes: {
              discreteOnlyOpenClose: false,
              queryOnlyOpenClose: false,
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
    assert.notCalled(gladys.stateManager.get);
    assert.notCalled(gladys.event.emit);
  });

  it('should generate read only device - onSync', async () => {
    device.features[0].read_only = true;

    const result = await googleActionsHandler.onSync(body);

    const expectedResult = {
      requestId: 'request-id',
      payload: {
        agentUserId: 'user-id',
        devices: [
          {
            id: 'device-1',
            type: 'action.devices.types.SHUTTER',
            traits: ['action.devices.traits.OpenClose'],
            attributes: {
              discreteOnlyOpenClose: false,
              queryOnlyOpenClose: true,
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
    assert.notCalled(gladys.stateManager.get);
    assert.notCalled(gladys.event.emit);
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
            openPercent: 73,
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
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      device: 'device-1',
      device_feature: 'feature-1',
      status: 'pending',
      type: 'device.set-value',
      value: 73,
    });
  });
});
