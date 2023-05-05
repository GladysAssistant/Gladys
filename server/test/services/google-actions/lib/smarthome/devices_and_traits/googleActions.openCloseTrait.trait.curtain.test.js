const sinon = require('sinon');
const { expect } = require('chai');

const { assert, fake } = sinon;
const GoogleActionsHandler = require('../../../../../../services/google-actions/lib');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, EVENTS } = require('../../../../../../utils/constants');

const serviceId = 'd1e45425-fe25-4968-ac0f-bc695d5202d9';
const headers = {
  authentication: 'Bearer my-bearer-token',
};

describe('GoogleActions Handler - onSync - openClose - curtain', () => {
  let gladys;
  let device;
  let body;
  let expectedResult;

  beforeEach(() => {
    device = {
      name: 'Device 1',
      selector: 'device-1',
      external_id: 'device-1-external-id',
      features: [],
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

    body = {
      requestId: 'request-id',
      user: {
        id: 'user-id',
        selector: 'user-selector',
      },
    };

    expectedResult = {
      requestId: 'request-id',
      payload: {
        agentUserId: 'user-id',
      },
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('onSync - position only - actionnable', async () => {
    device.features = [
      {
        category: DEVICE_FEATURE_CATEGORIES.CURTAIN,
        type: DEVICE_FEATURE_TYPES.CURTAIN.POSITION,
        last_value: 73,
        read_only: false,
      },
    ];

    const googleActionsHandler = new GoogleActionsHandler(gladys, serviceId);
    const result = await googleActionsHandler.onSync(body);

    expectedResult.payload.devices = [
      {
        id: 'device-1',
        type: 'action.devices.types.CURTAIN',
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
    ];
    expect(result).to.deep.eq(expectedResult);
    assert.calledOnce(gladys.stateManager.state.device.device_1.get);
  });

  it('onSync - position only - not actionnable', async () => {
    device.features = [
      {
        category: DEVICE_FEATURE_CATEGORIES.CURTAIN,
        type: DEVICE_FEATURE_TYPES.CURTAIN.POSITION,
        last_value: 73,
        read_only: true,
      },
    ];

    const googleActionsHandler = new GoogleActionsHandler(gladys, serviceId);
    const result = await googleActionsHandler.onSync(body);

    expectedResult.payload.devices = [
      {
        id: 'device-1',
        type: 'action.devices.types.CURTAIN',
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
    ];
    expect(result).to.deep.eq(expectedResult);
    assert.calledOnce(gladys.stateManager.state.device.device_1.get);
  });

  it('onQuery - with position', async () => {
    device.features = [
      {
        category: DEVICE_FEATURE_CATEGORIES.CURTAIN,
        type: DEVICE_FEATURE_TYPES.CURTAIN.POSITION,
        last_value: 73,
        read_only: false,
      },
    ];

    body.inputs = [
      {
        payload: {
          devices: [
            {
              id: 'device-1',
            },
          ],
        },
      },
    ];

    const googleActionsHandler = new GoogleActionsHandler(gladys, serviceId);
    const result = await googleActionsHandler.onQuery(body, headers);

    expectedResult.payload.devices = {
      'device-1': {
        online: true,
        openPercent: 73,
      },
    };
    expect(result).to.deep.eq(expectedResult);
    assert.calledOnce(gladys.stateManager.get);
  });

  it('onExecute - openPercent', async () => {
    body.inputs = [
      {
        payload: {
          commands: [
            {
              devices: [{ id: 'device-1' }],
              execution: [
                {
                  command: 'action.devices.commands.OpenClose',
                  params: {
                    openPercent: 73,
                  },
                },
              ],
            },
          ],
        },
      },
    ];

    const googleActionsHandler = new GoogleActionsHandler(gladys, serviceId);
    const result = await googleActionsHandler.onExecute(body, headers);

    expectedResult.payload.commands = [
      {
        ids: ['device-1'],
        status: 'PENDING',
      },
    ];
    expect(result).to.deep.eq(expectedResult);

    assert.calledTwice(gladys.event.emit);
    assert.calledWithExactly(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      device: 'device-1',
      feature_category: DEVICE_FEATURE_CATEGORIES.CURTAIN,
      feature_type: DEVICE_FEATURE_TYPES.CURTAIN.POSITION,
      status: 'pending',
      type: 'device.set-value',
      value: 73,
    });
    assert.calledWithExactly(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      device: 'device-1',
      feature_category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
      feature_type: DEVICE_FEATURE_TYPES.CURTAIN.POSITION,
      status: 'pending',
      type: 'device.set-value',
      value: 73,
    });
  });

  it('onExecute - followUpToken', async () => {
    body.inputs = [
      {
        payload: {
          commands: [
            {
              devices: [{ id: 'device-1' }],
              execution: [
                {
                  command: 'action.devices.commands.OpenClose',
                  params: {
                    followUpToken: '456',
                  },
                },
              ],
            },
          ],
        },
      },
    ];

    const googleActionsHandler = new GoogleActionsHandler(gladys, serviceId);
    const result = await googleActionsHandler.onExecute(body, headers);

    expectedResult.payload.commands = [
      {
        ids: ['device-1'],
        status: 'PENDING',
      },
    ];
    expect(result).to.deep.eq(expectedResult);

    assert.notCalled(gladys.event.emit);
  });
});
