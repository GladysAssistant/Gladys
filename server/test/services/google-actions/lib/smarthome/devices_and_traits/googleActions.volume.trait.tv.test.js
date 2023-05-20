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
      },
    },
  ],
};

describe('GoogleActions Handler - onSync - volume (tv)', () => {
  let device;
  let gladys;
  let googleActionsHandler;

  beforeEach(() => {
    device = {
      name: 'Device 1',
      selector: 'device-1',
      external_id: 'device-1-external-id',
      features: [
        {
          selector: 'feature-volume',
          category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
          type: DEVICE_FEATURE_TYPES.TELEVISION.VOLUME,
          last_value: 11,
        },
        {
          selector: 'feature-mute',
          category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
          type: DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_MUTE,
          last_value: 1,
        },
        {
          selector: 'feature-volume-up',
          category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
          type: DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_UP,
          last_value: 1,
        },
        {
          selector: 'feature-volume-down',
          category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
          type: DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_DOWN,
          last_value: 1,
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

  it('should generate device without mute/unmute command - onSync', async () => {
    device.features = [
      {
        selector: 'feature-volume',
        category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
        type: DEVICE_FEATURE_TYPES.TELEVISION.VOLUME,
        last_value: 11,
        max: 45,
        has_feedback: true,
      },
    ];

    const result = await googleActionsHandler.onSync(body);

    const expectedResult = {
      requestId: 'request-id',
      payload: {
        agentUserId: 'user-id',
        devices: [
          {
            id: 'device-1',
            type: 'action.devices.types.TV',
            traits: ['action.devices.traits.Volume'],
            attributes: {
              volumeMaxLevel: 45,
              volumeCanMuteAndUnmute: false,
              commandOnlyVolume: false,
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

  it('should generate device with mute/unmute command - onSync', async () => {
    device.features = [
      {
        selector: 'feature-mute',
        category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
        type: DEVICE_FEATURE_TYPES.TELEVISION.VOLUME_MUTE,
        last_value: 1,
      },
    ];

    const result = await googleActionsHandler.onSync(body);

    const expectedResult = {
      requestId: 'request-id',
      payload: {
        agentUserId: 'user-id',
        devices: [
          {
            id: 'device-1',
            type: 'action.devices.types.TV',
            traits: ['action.devices.traits.Volume'],
            attributes: {
              volumeMaxLevel: 30,
              volumeCanMuteAndUnmute: true,
              commandOnlyVolume: true,
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
            currentVolume: 11,
            isMuted: false,
          },
        },
      },
    };
    expect(result).to.deep.eq(expectedResult);

    assert.notCalled(gladys.stateManager.state.device.device_1.get);
    assert.calledOnceWithExactly(gladys.stateManager.get, 'device', 'device-1');
    assert.notCalled(gladys.event.emit);
  });

  describe('onExecute', () => {
    it('should mute', async () => {
      const muteBody = { ...body };
      muteBody.inputs = [
        {
          payload: {
            commands: [
              {
                devices: [{ id: 'device-1' }],
                execution: [
                  {
                    command: 'action.devices.commands.mute',
                    params: {
                      mute: true,
                    },
                  },
                ],
              },
            ],
          },
        },
      ];

      const result = await googleActionsHandler.onExecute(muteBody);

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
        device_feature: 'feature-mute',
        status: 'pending',
        type: 'device.set-value',
        value: 1,
      });
    });

    it('should unmute', async () => {
      const unmuteBody = { ...body };
      unmuteBody.inputs = [
        {
          payload: {
            commands: [
              {
                devices: [{ id: 'device-1' }],
                execution: [
                  {
                    command: 'action.devices.commands.mute',
                    params: {
                      mute: false,
                    },
                  },
                ],
              },
            ],
          },
        },
      ];

      const result = await googleActionsHandler.onExecute(unmuteBody);

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
        device_feature: 'feature-mute',
        status: 'pending',
        type: 'device.set-value',
        value: 0,
      });
    });

    it('should set volume', async () => {
      const volumeBody = { ...body };
      volumeBody.inputs = [
        {
          payload: {
            commands: [
              {
                devices: [{ id: 'device-1' }],
                execution: [
                  {
                    command: 'action.devices.commands.setVolume',
                    params: {
                      volumeLevel: 7,
                    },
                  },
                ],
              },
            ],
          },
        },
      ];

      const result = await googleActionsHandler.onExecute(volumeBody);

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
        device_feature: 'feature-volume',
        status: 'pending',
        type: 'device.set-value',
        value: 7,
      });
    });

    it('should set relative negative volume', async () => {
      const relativeDownBody = { ...body };
      relativeDownBody.inputs = [
        {
          payload: {
            commands: [
              {
                devices: [{ id: 'device-1' }],
                execution: [
                  {
                    command: 'action.devices.commands.volumeRelative',
                    params: {
                      relativeSteps: -2,
                    },
                  },
                ],
              },
            ],
          },
        },
      ];

      const result = await googleActionsHandler.onExecute(relativeDownBody);

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
      assert.calledTwice(gladys.event.emit);
      assert.alwaysCalledWithExactly(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
        device: 'device-1',
        device_feature: 'feature-volume-down',
        status: 'pending',
        type: 'device.set-value',
        value: 1,
      });
    });

    it('should set relative negative volume without volume down', async () => {
      const relativeDownBody = { ...body };
      relativeDownBody.inputs = [
        {
          payload: {
            commands: [
              {
                devices: [{ id: 'device-1' }],
                execution: [
                  {
                    command: 'action.devices.commands.volumeRelative',
                    params: {
                      relativeSteps: -2,
                    },
                  },
                ],
              },
            ],
          },
        },
      ];

      device.features = [
        {
          selector: 'feature-volume',
          category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
          type: DEVICE_FEATURE_TYPES.TELEVISION.VOLUME,
          last_value: 11,
        },
      ];

      const result = await googleActionsHandler.onExecute(relativeDownBody);

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
        device_feature: 'feature-volume',
        status: 'pending',
        type: 'device.set-value',
        value: 9,
      });
    });

    it('should set relative positive volume', async () => {
      const relativeDownBody = { ...body };
      relativeDownBody.inputs = [
        {
          payload: {
            commands: [
              {
                devices: [{ id: 'device-1' }],
                execution: [
                  {
                    command: 'action.devices.commands.volumeRelative',
                    params: {
                      relativeSteps: 3,
                    },
                  },
                ],
              },
            ],
          },
        },
      ];

      const result = await googleActionsHandler.onExecute(relativeDownBody);

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
      assert.calledThrice(gladys.event.emit);
      assert.alwaysCalledWithExactly(gladys.event.emit, EVENTS.ACTION.TRIGGERED, {
        device: 'device-1',
        device_feature: 'feature-volume-up',
        status: 'pending',
        type: 'device.set-value',
        value: 1,
      });
    });

    it('should set relative positive volume without volume down', async () => {
      const relativeDownBody = { ...body };
      relativeDownBody.inputs = [
        {
          payload: {
            commands: [
              {
                devices: [{ id: 'device-1' }],
                execution: [
                  {
                    command: 'action.devices.commands.volumeRelative',
                    params: {
                      relativeSteps: 3,
                    },
                  },
                ],
              },
            ],
          },
        },
      ];

      device.features = [
        {
          selector: 'feature-volume',
          category: DEVICE_FEATURE_CATEGORIES.TELEVISION,
          type: DEVICE_FEATURE_TYPES.TELEVISION.VOLUME,
          last_value: 11,
        },
      ];

      const result = await googleActionsHandler.onExecute(relativeDownBody);

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
        device_feature: 'feature-volume',
        status: 'pending',
        type: 'device.set-value',
        value: 14,
      });
    });
  });
});
