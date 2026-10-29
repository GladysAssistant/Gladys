const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;
const EventEmitter = require('events');

const { ACTIONS } = require('../../../../utils/constants');
const executeActionsFactory = require('../../../../lib/scene/scene.executeActions');
const actionsFunc = require('../../../../lib/scene/scene.actions');

const StateManager = require('../../../../lib/state');

const event = new EventEmitter();

describe('scene.thermostat-set-schedule', () => {
  const { executeActions } = executeActionsFactory(actionsFunc);

  afterEach(() => {
    sinon.restore();
  });

  it('should make every thermostat follow the schedule', async () => {
    const stateManager = new StateManager(event);
    const thermostatService = {
      device: {
        running: true,
        attachScheduleToDevice: fake.resolves(null),
      },
    };
    const service = {
      getService: fake.returns(thermostatService),
    };
    await executeActions(
      { stateManager, event, service },
      [
        [
          {
            type: ACTIONS.THERMOSTAT.SET_SCHEDULE,
            schedule: 'school-holidays',
            devices: ['living-room-thermostat', 'bedroom-thermostat'],
          },
        ],
      ],
      {},
    );
    assert.calledWith(service.getService, 'thermostat');
    assert.calledTwice(thermostatService.device.attachScheduleToDevice);
    assert.calledWith(thermostatService.device.attachScheduleToDevice, 'school-holidays', 'living-room-thermostat');
    assert.calledWith(thermostatService.device.attachScheduleToDevice, 'school-holidays', 'bedroom-thermostat');
  });

  it('should switch the other thermostats when one of them fails', async () => {
    const stateManager = new StateManager(event);
    const attachScheduleToDevice = sinon.stub();
    attachScheduleToDevice.withArgs('school-holidays', 'deleted-thermostat').rejects(new Error('Device not found'));
    attachScheduleToDevice.resolves(null);
    const service = {
      getService: fake.returns({ device: { running: true, attachScheduleToDevice } }),
    };
    await executeActions(
      { stateManager, event, service },
      [
        [
          {
            type: ACTIONS.THERMOSTAT.SET_SCHEDULE,
            schedule: 'school-holidays',
            devices: ['deleted-thermostat', 'bedroom-thermostat'],
          },
        ],
      ],
      {},
    );
    assert.calledWith(attachScheduleToDevice, 'school-holidays', 'bedroom-thermostat');
  });

  it('should do nothing when the thermostat service is not loaded', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: fake.returns(null),
    };
    await executeActions(
      { stateManager, event, service },
      [
        [
          {
            type: ACTIONS.THERMOSTAT.SET_SCHEDULE,
            schedule: 'school-holidays',
            devices: ['living-room-thermostat'],
          },
        ],
      ],
      {},
      null,
      { throwUnknownError: true },
    );
    assert.calledWith(service.getService, 'thermostat');
  });

  // Every in-tree service sits in the stateManager whatever its status: a stopped
  // one is still found, and only `running` says it runs.
  it('should do nothing when the thermostat service is stopped', async () => {
    const stateManager = new StateManager(event);
    const thermostatService = {
      device: {
        running: false,
        attachScheduleToDevice: fake.resolves(null),
      },
    };
    const service = {
      getService: fake.returns(thermostatService),
    };
    await executeActions(
      { stateManager, event, service },
      [
        [
          {
            type: ACTIONS.THERMOSTAT.SET_SCHEDULE,
            schedule: 'school-holidays',
            devices: ['living-room-thermostat'],
          },
        ],
      ],
      {},
      null,
      { throwUnknownError: true },
    );
    assert.notCalled(thermostatService.device.attachScheduleToDevice);
  });

  it('should do nothing when no thermostat was picked', async () => {
    const stateManager = new StateManager(event);
    const thermostatService = {
      device: {
        running: true,
        attachScheduleToDevice: fake.resolves(null),
      },
    };
    const service = {
      getService: fake.returns(thermostatService),
    };
    await executeActions(
      { stateManager, event, service },
      [
        [
          {
            type: ACTIONS.THERMOSTAT.SET_SCHEDULE,
            schedule: 'school-holidays',
          },
        ],
      ],
      {},
      null,
      { throwUnknownError: true },
    );
    assert.notCalled(thermostatService.device.attachScheduleToDevice);
  });
});
