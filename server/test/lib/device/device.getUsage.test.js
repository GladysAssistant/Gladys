const EventEmitter = require('events');
const { expect } = require('chai');

const db = require('../../../models');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');
const { DASHBOARD_TYPE, DASHBOARD_VISIBILITY, ACTIONS, EVENTS } = require('../../../utils/constants');

const event = new EventEmitter();
const job = new Job(event);

const USER_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';
const OTHER_USER_ID = '7a137a56-069e-4996-8816-36558174b727';

describe('Device.getUsage', () => {
  let device;

  beforeEach(() => {
    const stateManager = new StateManager(event);
    device = new Device(event, {}, stateManager, {}, {}, {}, job);
  });

  it('should return an empty object when no dashboard and no scene use a device', async () => {
    const usage = await device.getUsage(USER_ID);
    expect(usage).to.deep.equal({});
  });

  it('should return the dashboards using a device, through a feature or directly', async () => {
    await db.Dashboard.create({
      name: 'Dashboard with devices',
      selector: 'dashboard-with-devices',
      user_id: USER_ID,
      type: DASHBOARD_TYPE.MAIN,
      visibility: DASHBOARD_VISIBILITY.PRIVATE,
      position: 1,
      boxes: [
        [
          {
            type: 'devices-in-room',
            device_features: ['test-device-feature', 'unknown-feature'],
          },
          {
            type: 'camera',
            camera: 'test-camera',
          },
        ],
        [
          {
            type: 'chart',
            device_feature: 'test-temperature-sensor',
          },
        ],
      ],
    });

    const usage = await device.getUsage(USER_ID);

    expect(usage).to.have.all.keys(['test-device', 'test-camera']);
    expect(usage['test-device'].scenes).to.deep.equal([]);
    expect(usage['test-device'].dashboards).to.have.lengthOf(1);
    expect(usage['test-device'].dashboards[0]).to.deep.equal({
      id: usage['test-device'].dashboards[0].id,
      name: 'Dashboard with devices',
      selector: 'dashboard-with-devices',
      type: DASHBOARD_TYPE.MAIN,
    });
    expect(usage['test-camera'].dashboards).to.have.lengthOf(1);
  });

  it('should return the scenes using a device, in actions (even nested) and in triggers', async () => {
    await db.Scene.create({
      name: 'Scene with devices',
      selector: 'scene-with-devices',
      icon: 'fe fe-bell',
      actions: [
        [],
        [
          {
            type: ACTIONS.DEVICE.SET_VALUE,
            device_feature: 'test-device-feature-2',
            value: 1,
          },
          {
            type: ACTIONS.CONDITION.ONLY_CONTINUE_IF,
            conditions: [],
          },
        ],
        [
          {
            type: ACTIONS.CONDITION.IF_THEN_ELSE,
            if: [],
            then: [
              [
                {
                  type: ACTIONS.LIGHT.TURN_ON,
                  devices: ['test-device-2', 'unknown-device'],
                },
              ],
            ],
            else: [],
          },
        ],
      ],
      triggers: [
        {
          type: EVENTS.DEVICE.NEW_STATE,
          device_feature: 'test-camera-image',
        },
      ],
    });

    const usage = await device.getUsage(USER_ID);

    expect(usage).to.have.all.keys(['test-device', 'test-device-2', 'test-camera']);
    expect(usage['test-device'].dashboards).to.deep.equal([]);
    expect(usage['test-device'].scenes).to.have.lengthOf(1);
    expect(usage['test-device'].scenes[0]).to.deep.equal({
      id: usage['test-device'].scenes[0].id,
      name: 'Scene with devices',
      selector: 'scene-with-devices',
      icon: 'fe fe-bell',
    });
    expect(usage['test-device-2'].scenes).to.have.lengthOf(1);
    expect(usage['test-camera'].scenes).to.have.lengthOf(1);
  });

  it('should merge the dashboards and the scenes of the same device', async () => {
    await db.Dashboard.create({
      name: 'Dashboard main',
      selector: 'dashboard-main',
      user_id: USER_ID,
      type: DASHBOARD_TYPE.MAIN,
      visibility: DASHBOARD_VISIBILITY.PRIVATE,
      position: 1,
      boxes: [[{ type: 'devices-in-room', device: 'test-device' }]],
    });
    await db.Scene.create({
      name: 'Scene main',
      selector: 'scene-main',
      icon: 'fe fe-bell',
      actions: [[{ type: ACTIONS.DEVICE.SET_VALUE, device_feature: 'test-device-feature', value: 1 }]],
      triggers: [],
    });

    const usage = await device.getUsage(USER_ID);

    expect(usage).to.have.all.keys(['test-device']);
    expect(usage['test-device'].dashboards).to.have.lengthOf(1);
    expect(usage['test-device'].scenes).to.have.lengthOf(1);
  });

  it('should not return the private dashboard of another user, but return his public one', async () => {
    await db.Dashboard.create({
      name: 'Private dashboard of another user',
      selector: 'private-dashboard-other-user',
      user_id: OTHER_USER_ID,
      type: DASHBOARD_TYPE.MAIN,
      visibility: DASHBOARD_VISIBILITY.PRIVATE,
      position: 1,
      boxes: [[{ type: 'devices-in-room', device: 'test-device' }]],
    });
    await db.Dashboard.create({
      name: 'Public dashboard of another user',
      selector: 'public-dashboard-other-user',
      user_id: OTHER_USER_ID,
      type: DASHBOARD_TYPE.MAIN,
      visibility: DASHBOARD_VISIBILITY.PUBLIC,
      position: 2,
      boxes: [[{ type: 'devices-in-room', device: 'test-device' }]],
    });

    const usage = await device.getUsage(USER_ID);

    expect(usage).to.have.all.keys(['test-device']);
    expect(usage['test-device'].dashboards).to.have.lengthOf(1);
    expect(usage['test-device'].dashboards[0].selector).to.equal('public-dashboard-other-user');
  });
});
