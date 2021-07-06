const sinon = require('sinon');
const { expect } = require('chai');

const { assert, fake } = sinon;
const GoogleActionsHandler = require('../../../../../services/google-actions/lib');

const gladys = {
  stateManager: {
    state: {
      device: {},
    },
  },
};
const serviceId = 'd1e45425-fe25-4968-ac0f-bc695d5202d9';

describe('GoogleActions Handler - onSync', () => {
  beforeEach(() => {
    sinon.reset();
    gladys.stateManager.state.device = {};
  });

  it('onSync', async () => {
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

    const body = {
      requestId: 'request-id',
      user: {
        id: 'user-id',
        selector: 'user-selector',
      },
    };

    const googleActionsHandler = new GoogleActionsHandler(gladys, serviceId);
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

  it('onSync - no device', async () => {
    const body = {
      requestId: 'request-id',
      user: {
        id: 'user-id',
        selector: 'user-selector',
      },
    };

    const googleActionsHandler = new GoogleActionsHandler(gladys, serviceId);
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

  it('onSync - not matching device', async () => {
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

    const body = {
      requestId: 'request-id',
      user: {
        id: 'user-id',
        selector: 'user-selector',
      },
    };
    const googleActionsHandler = new GoogleActionsHandler(gladys, serviceId);
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
