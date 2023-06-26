const sinon = require('sinon');
const { expect } = require('chai');

const { assert, fake } = sinon;

const GoogleActionsHandler = require('../../../../../services/google-actions/lib');

const serviceId = 'd1e45425-fe25-4968-ac0f-bc695d5202d9';

describe('GoogleActions Handler - onQuery', () => {
  let gladys;

  beforeEach(() => {
    gladys = {
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
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should generate device payload', async () => {
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

    const googleActionsHandler = new GoogleActionsHandler(gladys, serviceId);
    const result = await googleActionsHandler.onQuery(body);

    const exptectedResult = {
      requestId: 'request-id',
      payload: {
        agentUserId: 'user-id',
        devices: {
          'device-1': {
            online: true,
            on: false,
          },
        },
      },
    };
    expect(result).to.deep.eq(exptectedResult);
    assert.calledOnceWithExactly(gladys.stateManager.get, 'device', 'device-1');
  });
});
