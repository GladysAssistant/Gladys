const sinon = require('sinon');
const { expect } = require('chai');

const { assert, fake } = sinon;

const GoogleActionsHandler = require('../../../../../services/google-actions/lib');

const serviceId = 'd1e45425-fe25-4968-ac0f-bc695d5202d9';
const body = {
  requestId: 'request-id',
  user: {
    id: 'user-id',
    selector: 'user-selector',
  },
};

describe('GoogleActions Handler - onSync', () => {
  let gladys;
  let googleActionsHandler;

  beforeEach(() => {
    gladys = {
      stateManager: {
        state: {
          device: {},
        },
      },
    };

    googleActionsHandler = new GoogleActionsHandler(gladys, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should generate devices', async () => {
    gladys.stateManager.state.device = {
      device_1: {
        get: fake.returns({
          name: 'Device 1',
          selector: 'device-1',
          external_id: 'device-1-external-id',
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
        }),
      },
    };

    const result = await googleActionsHandler.onSync(body);

    const exptectedResult = {
      requestId: 'request-id',
      payload: {
        agentUserId: 'user-id',
        devices: [
          {
            id: 'device-1',
            type: 'action.devices.types.SWITCH',
            traits: ['action.devices.traits.OnOff'],
            attributes: {},
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
    expect(result).to.deep.eq(exptectedResult);
    assert.calledOnce(gladys.stateManager.state.device.device_1.get);
  });

  it('should get empty devices', async () => {
    const result = await googleActionsHandler.onSync(body);

    const exptectedResult = {
      requestId: 'request-id',
      payload: {
        agentUserId: 'user-id',
        devices: [],
      },
    };
    expect(result).to.deep.eq(exptectedResult);
  });

  it('should not generate device - none matching', async () => {
    gladys.stateManager.state.device = {
      device_1: {
        get: fake.returns({
          name: 'Device 1',
          selector: 'device-1',
          features: [
            {
              category: 'unknwon',
              type: 'unknow',
            },
          ],
          model: 'device-model',
          room: {
            name: 'living-room',
          },
        }),
      },
    };

    const result = await googleActionsHandler.onSync(body);

    const exptectedResult = {
      requestId: 'request-id',
      payload: {
        agentUserId: 'user-id',
        devices: [],
      },
    };
    expect(result).to.deep.eq(exptectedResult);
    assert.calledOnce(gladys.stateManager.state.device.device_1.get);
  });
});
