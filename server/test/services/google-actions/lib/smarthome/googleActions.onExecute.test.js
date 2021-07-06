const sinon = require('sinon');
const { expect } = require('chai');

const { assert, fake } = sinon;
const GoogleActionsHandler = require('../../../../../services/google-actions/lib');

const gladys = {
  event: {
    emit: fake.resolves(true),
  },
};
const serviceId = 'd1e45425-fe25-4968-ac0f-bc695d5202d9';

describe('GoogleActions Handler - onExecute', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('onExecute - empty payload', async () => {
    const body = {
      requestId: 'request-id',
      user: {
        id: 'user-id',
        selector: 'user-selector',
      },
      inputs: [],
    };
    const headers = {};

    const googleActionsHandler = new GoogleActionsHandler(gladys, serviceId);
    const result = await googleActionsHandler.onExecute(body, headers);

    const exptectedResult = {
      requestId: 'request-id',
      payload: {
        agentUserId: 'user-id',
        commands: [],
      },
    };
    expect(result).to.deep.eq(exptectedResult);
    assert.notCalled(gladys.event.emit);
  });

  it('onExecute - empty commands', async () => {
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
    const headers = {};

    const googleActionsHandler = new GoogleActionsHandler(gladys, serviceId);
    const result = await googleActionsHandler.onExecute(body, headers);

    const exptectedResult = {
      requestId: 'request-id',
      payload: {
        agentUserId: 'user-id',
        commands: [],
      },
    };
    expect(result).to.deep.eq(exptectedResult);
    assert.notCalled(gladys.event.emit);
  });

  it('onExecute - empty devices', async () => {
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
    const headers = {};

    const googleActionsHandler = new GoogleActionsHandler(gladys, serviceId);
    const result = await googleActionsHandler.onExecute(body, headers);

    const exptectedResult = {
      requestId: 'request-id',
      payload: {
        agentUserId: 'user-id',
        commands: [],
      },
    };
    expect(result).to.deep.eq(exptectedResult);
    assert.notCalled(gladys.event.emit);
  });

  it('onExecute - command not managed', async () => {
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
    const headers = {};

    const googleActionsHandler = new GoogleActionsHandler(gladys, serviceId);
    const result = await googleActionsHandler.onExecute(body, headers);

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
    assert.notCalled(gladys.event.emit);
  });

  it('onExecute - value func not managed', async () => {
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
                      unknown: true,
                    },
                  },
                ],
              },
            ],
          },
        },
      ],
    };
    const headers = {};

    const googleActionsHandler = new GoogleActionsHandler(gladys, serviceId);
    const result = await googleActionsHandler.onExecute(body, headers);

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
    assert.notCalled(gladys.event.emit);
  });

  it('onExecute - success', async () => {
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
    const headers = {};

    const googleActionsHandler = new GoogleActionsHandler(gladys, serviceId);
    const result = await googleActionsHandler.onExecute(body, headers);

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
    assert.callCount(gladys.event.emit, 2);
  });
});
