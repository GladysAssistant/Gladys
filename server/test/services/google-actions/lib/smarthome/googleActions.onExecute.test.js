const sinon = require('sinon');
const { expect } = require('chai');

const { assert, fake } = sinon;

const { EVENTS, ACTIONS_STATUS, ACTIONS } = require('../../../../../utils/constants');
const GoogleActionsHandler = require('../../../../../services/google-actions/lib');

const serviceId = 'd1e45425-fe25-4968-ac0f-bc695d5202d9';

describe('GoogleActions Handler - onExecute', () => {
  let gladys;
  let googleActionsHandler;

  beforeEach(() => {
    gladys = {
      event: {
        emit: fake.returns(true),
      },
      stateManager: {
        get: fake.returns({
          selector: 'device-1',
          features: [
            {
              selector: 'feature-1',
              category: 'switch',
              type: 'binary',
            },
          ],
        }),
      },
    };
    googleActionsHandler = new GoogleActionsHandler(gladys, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should do nothing - empty payload', async () => {
    const body = {
      requestId: 'request-id',
      user: {
        id: 'user-id',
        selector: 'user-selector',
      },
      inputs: [],
    };

    const result = await googleActionsHandler.onExecute(body);

    const exptectedResult = {
      requestId: 'request-id',
      payload: {
        agentUserId: 'user-id',
        commands: [],
      },
    };

    expect(result).to.deep.eq(exptectedResult);
    assert.notCalled(gladys.stateManager.get);
    assert.notCalled(gladys.event.emit);
  });

  it('should do nothing - empty commands', async () => {
    const body = {
      requestId: 'request-id',
      user: {
        id: 'user-id',
        selector: 'user-selector',
      },
      inputs: [
        {
          payload: {},
        },
        {
          payload: {},
        },
      ],
    };

    const result = await googleActionsHandler.onExecute(body);

    const exptectedResult = {
      requestId: 'request-id',
      payload: {
        agentUserId: 'user-id',
        commands: [],
      },
    };
    expect(result).to.deep.eq(exptectedResult);
    assert.notCalled(gladys.stateManager.get);
    assert.notCalled(gladys.event.emit);
  });

  it('should do nothing - empty devices', async () => {
    const body = {
      requestId: 'request-id',
      user: {
        id: 'user-id',
        selector: 'user-selector',
      },
      inputs: [
        {
          payload: {
            commands: [],
          },
        },
        {
          payload: {},
        },
      ],
    };

    const result = await googleActionsHandler.onExecute(body);

    const exptectedResult = {
      requestId: 'request-id',
      payload: {
        agentUserId: 'user-id',
        commands: [],
      },
    };
    expect(result).to.deep.eq(exptectedResult);
    assert.notCalled(gladys.stateManager.get);
    assert.notCalled(gladys.event.emit);
  });

  it('should send errorneous device - unkonwn device', async () => {
    gladys.stateManager.get = fake.returns(null);

    const body = {
      requestId: 'request-id',
      user: {
        id: 'user-id',
        selector: 'user-selector',
      },
      inputs: [
        {
          payload: {
            commands: [
              {
                devices: [{ id: 'device-1' }],
              },
            ],
          },
        },
      ],
    };

    const result = await googleActionsHandler.onExecute(body);

    const exptectedResult = {
      requestId: 'request-id',
      payload: {
        agentUserId: 'user-id',
        commands: [
          {
            ids: ['device-1'],
            status: 'ERROR',
          },
        ],
      },
    };
    expect(result).to.deep.eq(exptectedResult);
    assert.calledOnceWithExactly(gladys.stateManager.get, 'device', 'device-1');
    assert.notCalled(gladys.event.emit);
  });

  it('should send errorneous device - command not managed', async () => {
    const body = {
      requestId: 'request-id',
      user: {
        id: 'user-id',
        selector: 'user-selector',
      },
      inputs: [
        {
          payload: {
            commands: [
              {
                devices: [{ id: 'device-1' }],
                execution: [
                  {
                    command: 'action.devices.commands.Unknown',
                  },
                ],
              },
            ],
          },
        },
      ],
    };

    const result = await googleActionsHandler.onExecute(body);

    const exptectedResult = {
      requestId: 'request-id',
      payload: {
        agentUserId: 'user-id',
        commands: [
          {
            ids: ['device-1'],
            status: 'ERROR',
          },
        ],
      },
    };
    expect(result).to.deep.eq(exptectedResult);
    assert.calledOnceWithExactly(gladys.stateManager.get, 'device', 'device-1');
    assert.notCalled(gladys.event.emit);
  });

  it('should send errorneous device - no events generated', async () => {
    gladys.stateManager.get = fake.returns({
      selector: 'device-1',
      features: [],
    });

    const body = {
      requestId: 'request-id',
      user: {
        id: 'user-id',
        selector: 'user-selector',
      },
      inputs: [
        {
          payload: {
            commands: [
              {
                devices: [{ id: 'device-1' }],
                execution: [
                  {
                    command: 'action.devices.commands.OnOff',
                    params: {
                      on: true,
                    },
                  },
                ],
              },
            ],
          },
        },
      ],
    };

    const result = await googleActionsHandler.onExecute(body);

    const exptectedResult = {
      requestId: 'request-id',
      payload: {
        agentUserId: 'user-id',
        commands: [
          {
            ids: ['device-1'],
            status: 'ERROR',
          },
        ],
      },
    };
    expect(result).to.deep.eq(exptectedResult);
    assert.calledOnceWithExactly(gladys.stateManager.get, 'device', 'device-1');
    assert.notCalled(gladys.event.emit);
  });

  it('should emit event - onExecute', async () => {
    const body = {
      requestId: 'request-id',
      user: {
        id: 'user-id',
        selector: 'user-selector',
      },
      inputs: [
        {
          payload: {
            commands: [
              {
                devices: [{ id: 'device-1' }],
                execution: [
                  {
                    command: 'action.devices.commands.OnOff',
                    params: {
                      on: true,
                    },
                  },
                ],
              },
            ],
          },
        },
      ],
    };

    const result = await googleActionsHandler.onExecute(body);

    const exptectedResult = {
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
    expect(result).to.deep.eq(exptectedResult);

    assert.calledOnceWithExactly(gladys.stateManager.get, 'device', 'device-1');

    const expectedAction = {
      device_feature: 'feature-1',
      value: 1,
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      device: 'device-1',
    };
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.ACTION.TRIGGERED, expectedAction);
  });
});
