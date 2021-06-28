const sinon = require('sinon');
const { expect } = require('chai');

const { assert, fake } = sinon;
const GoogleActionsHandler = require('../../../../../../services/google-actions/lib');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, EVENTS } = require('../../../../../../utils/constants');

const device = {
  name: 'Device 1',
  selector: 'device-1',
  external_id: 'device-1-external-id',
  features: [
    {
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
      last_value: 73,
    },
  ],
  model: 'device-model',
  room: {
    name: 'living-room',
  },
};

const gladys = {
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
const serviceId = 'd1e45425-fe25-4968-ac0f-bc695d5202d9';

let body;
let expectedResult;

describe('GoogleActions Handler - onSync - brightness (switch)', () => {
  beforeEach(() => {
    sinon.reset();

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

  it('onSync', async () => {
    const googleActionsHandler = new GoogleActionsHandler(gladys, serviceId);
    const result = await googleActionsHandler.onSync(body);

    expectedResult.payload.devices = [
      {
        id: 'device-1',
        type: 'action.devices.types.LIGHT',
        traits: ['action.devices.traits.Brightness'],
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
    ];
    expect(result).to.deep.eq(expectedResult);
    assert.calledOnce(gladys.stateManager.state.device.device_1.get);
  });

  it('onQuery', async () => {
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
    const result = await googleActionsHandler.onQuery(body);

    expectedResult.payload.devices = {
      'device-1': {
        online: true,
        brightness: 73,
      },
    };
    expect(result).to.deep.eq(expectedResult);
    assert.calledOnce(gladys.stateManager.get);
  });

  it('onExecute', async () => {
    body.inputs = [
      {
        payload: {
          commands: [
            {
              devices: [{ id: 'device-1' }],
              execution: [
                {
                  command: 'action.devices.commands.BrightnessAbsolute',
                  params: {
                    brightness: 20,
                  },
                },
              ],
            },
          ],
        },
      },
    ];

    const googleActionsHandler = new GoogleActionsHandler(gladys, serviceId);
    const result = await googleActionsHandler.onExecute(body);

    expectedResult.payload.commands = [
      {
        ids: ['device-1'],
        status: 'PENDING',
      },
    ];
    expect(result).to.deep.eq(expectedResult);
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      device: 'device-1',
      feature_category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      feature_type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
      status: 'pending',
      type: 'device.set-value',
      value: 20,
    });
    assert.calledWith(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
      device: 'device-1',
      feature_category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      feature_type: DEVICE_FEATURE_TYPES.SWITCH.DIMMER,
      status: 'pending',
      type: 'device.set-value',
      value: 20,
    });
  });
});
