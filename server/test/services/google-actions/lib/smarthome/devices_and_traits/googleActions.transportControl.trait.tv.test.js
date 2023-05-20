const sinon = require('sinon');
const { expect } = require('chai');

const { assert, fake } = sinon;

const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, EVENTS } = require('../../../../../../utils/constants');
const GoogleActionsHandler = require('../../../../../../services/google-actions/lib');

const serviceId = 'd1e45425-fe25-4968-ac0f-bc695d5202d9';

const device = {
  name: 'Device 1',
  selector: 'device-1',
  external_id: 'device-1-external-id',
  features: [
    {
      selector: 'feature-pause',
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.PAUSE,
    },
    {
      selector: 'feature-play',
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.PLAY,
    },
    {
      selector: 'feature-stop',
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.STOP,
    },
    {
      selector: 'feature-next',
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.NEXT,
    },
    {
      selector: 'feature-previous',
      category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
      type: DEVICE_FEATURE_TYPES.TELEVISION.PREVIOUS,
    },
  ],
  model: 'device-model',
  room: {
    name: 'living-room',
  },
};

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

describe('GoogleActions Handler - onSync - TransportControl (tv)', () => {
  let gladys;
  let googleActionsHandler;

  beforeEach(() => {
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
            type: 'action.devices.types.TV',
            traits: ['action.devices.traits.TransportControl'],
            attributes: {
              transportControlSupportedCommands: ['PAUSE', 'RESUME', 'STOP', 'NEXT', 'PREVIOUS'],
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
          },
        },
      },
    };
    expect(result).to.deep.eq(expectedResult);

    assert.notCalled(gladys.stateManager.state.device.device_1.get);
    assert.calledOnceWithExactly(gladys.stateManager.get, 'device', 'device-1');
    assert.notCalled(gladys.event.emit);
  });

  it('should emit Gladys STOP event - onExecute', async () => {
    const commandBody = { ...body };
    commandBody.inputs = [
      {
        payload: {
          commands: [
            {
              devices: [{ id: 'device-1' }],
              execution: [
                {
                  command: 'action.devices.commands.mediaStop',
                  params: {
                    on: false,
                  },
                },
              ],
            },
          ],
        },
      },
    ];
    const result = await googleActionsHandler.onExecute(commandBody);

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
      device_feature: 'feature-stop',
      status: 'pending',
      type: 'device.set-value',
      value: 1,
    });
  });

  it('should emit Gladys PAUSE event - onExecute', async () => {
    const commandBody = { ...body };
    commandBody.inputs = [
      {
        payload: {
          commands: [
            {
              devices: [{ id: 'device-1' }],
              execution: [
                {
                  command: 'action.devices.commands.mediaPause',
                  params: {
                    on: false,
                  },
                },
              ],
            },
          ],
        },
      },
    ];
    const result = await googleActionsHandler.onExecute(commandBody);

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
      device_feature: 'feature-pause',
      status: 'pending',
      type: 'device.set-value',
      value: 1,
    });
  });

  it('should emit Gladys PLAY event - onExecute', async () => {
    const commandBody = { ...body };
    commandBody.inputs = [
      {
        payload: {
          commands: [
            {
              devices: [{ id: 'device-1' }],
              execution: [
                {
                  command: 'action.devices.commands.mediaResume',
                  params: {
                    on: false,
                  },
                },
              ],
            },
          ],
        },
      },
    ];
    const result = await googleActionsHandler.onExecute(commandBody);

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
      device_feature: 'feature-play',
      status: 'pending',
      type: 'device.set-value',
      value: 1,
    });
  });

  it('should emit Gladys NEXT event - onExecute', async () => {
    const commandBody = { ...body };
    commandBody.inputs = [
      {
        payload: {
          commands: [
            {
              devices: [{ id: 'device-1' }],
              execution: [
                {
                  command: 'action.devices.commands.mediaNext',
                  params: {
                    on: false,
                  },
                },
              ],
            },
          ],
        },
      },
    ];
    const result = await googleActionsHandler.onExecute(commandBody);

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
      device_feature: 'feature-next',
      status: 'pending',
      type: 'device.set-value',
      value: 1,
    });
  });

  it('should emit Gladys PREVIOUS event - onExecute', async () => {
    const commandBody = { ...body };
    commandBody.inputs = [
      {
        payload: {
          commands: [
            {
              devices: [{ id: 'device-1' }],
              execution: [
                {
                  command: 'action.devices.commands.mediaPrevious',
                  params: {
                    on: false,
                  },
                },
              ],
            },
          ],
        },
      },
    ];
    const result = await googleActionsHandler.onExecute(commandBody);

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
      device_feature: 'feature-previous',
      status: 'pending',
      type: 'device.set-value',
      value: 1,
    });
  });
});
