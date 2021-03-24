const sinon = require('sinon');
const { expect } = require('chai');

const { assert, fake } = sinon;
const GoogleActionsHandler = require('../../../../../services/google-actions/lib');

const gladys = {
  stateManager: {
    get: fake.returns({
      name: 'Device 1',
      selector: 'device-1',
      features: [
        {
          category: 'switch',
          type: 'binary',
        },
      ],
      model: 'device-model',
      room: {
        name: 'living-room',
      },
      last_value: 0,
    }),
  },
};
const serviceId = 'd1e45425-fe25-4968-ac0f-bc695d5202d9';

describe('GoogleActions Handler - onQuery', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('onQuery', async () => {
    const body = {
      requestId: 'request-id',
      user: {
        selector: 'user-id',
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
    const headers = {
      authentication: 'Bearer my-bearer-token',
    };

    const googleActionsHandler = new GoogleActionsHandler(gladys, serviceId);
    const result = await googleActionsHandler.onQuery(body, headers);

    const exptectedResult = {
      requestId: 'request-id',
      payload: {
        agentUserId: 'user-id',
        devices: {
          'device-1': {
            online: true,
            status: 'ONLINE',
            on: false,
          },
        },
      },
    };
    expect(result).to.deep.eq(exptectedResult);
    assert.calledWith(gladys.stateManager.get, 'device', 'device-1');
  });
});
