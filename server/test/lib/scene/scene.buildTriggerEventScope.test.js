const { expect } = require('chai');
const { fake, assert } = require('sinon');
const EventEmitter = require('events');

const { EVENTS, ACTIONS } = require('../../../utils/constants');
const { buildTriggerEventScope } = require('../../../lib/scene/scene.buildTriggerEventScope');
const SceneManager = require('../../../lib/scene');
const StateManager = require('../../../lib/state');
const executeActionsFactory = require('../../../lib/scene/scene.executeActions');
const actionsFunc = require('../../../lib/scene/scene.actions');

describe('scene.buildTriggerEventScope', () => {
  let stateManager;

  beforeEach(() => {
    stateManager = new StateManager(new EventEmitter());
  });

  it('should enrich device.new-state event with device and deviceFeature info', () => {
    stateManager.setState('deviceFeature', 'door-sensor', {
      selector: 'door-sensor',
      name: 'Front door',
      category: 'opening-sensor',
      type: 'binary',
      unit: null,
      device_id: 'device-1',
    });
    stateManager.setState('deviceById', 'device-1', {
      selector: 'my-door',
      name: 'Door sensor',
    });

    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'door-sensor',
      previous_value: 0,
      last_value: 1,
      last_value_changed: new Date('2024-01-01'),
    };

    const triggerEvent = buildTriggerEventScope(event, stateManager);

    expect(triggerEvent).to.have.property('deviceFeature');
    expect(triggerEvent.deviceFeature).to.deep.include({
      selector: 'door-sensor',
      name: 'Front door',
      category: 'opening-sensor',
      type: 'binary',
      last_value: 1,
      previous_value: 0,
    });
    expect(triggerEvent.device).to.deep.equal({
      selector: 'my-door',
      name: 'Door sensor',
    });
  });

  it('should return event unchanged when device feature is unknown', () => {
    const event = {
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'unknown-sensor',
      previous_value: 0,
      last_value: 1,
    };

    const triggerEvent = buildTriggerEventScope(event, stateManager);

    expect(triggerEvent).to.not.have.property('deviceFeature');
    expect(triggerEvent).to.not.have.property('device');
    expect(triggerEvent.device_feature).to.equal('unknown-sensor');
  });

  it('should enrich user presence event with user and house info', () => {
    stateManager.setState('user', 'john', {
      selector: 'john',
      firstname: 'John',
      lastname: 'Doe',
    });
    stateManager.setState('house', 'main-house', {
      selector: 'main-house',
      name: 'Home',
    });

    const event = {
      type: EVENTS.USER_PRESENCE.BACK_HOME,
      user: 'john',
      house: 'main-house',
    };

    const triggerEvent = buildTriggerEventScope(event, stateManager);

    expect(triggerEvent.user).to.deep.equal({
      selector: 'john',
      firstname: 'John',
      lastname: 'Doe',
    });
    expect(triggerEvent.house).to.deep.equal({
      selector: 'main-house',
      name: 'Home',
    });
  });

  it('should enrich area event with user info', () => {
    stateManager.setState('user', 'john', {
      selector: 'john',
      firstname: 'John',
      lastname: 'Doe',
    });

    const event = {
      type: EVENTS.AREA.USER_ENTERED,
      user: 'john',
      area: 'kitchen',
    };

    const triggerEvent = buildTriggerEventScope(event, stateManager);

    expect(triggerEvent.user).to.deep.equal({
      selector: 'john',
      firstname: 'John',
      lastname: 'Doe',
    });
  });

  it('should return event unchanged for unsupported trigger types', () => {
    const event = {
      type: EVENTS.MQTT.RECEIVED,
      topic: 'gladys/test',
      message: 'hello',
    };

    const triggerEvent = buildTriggerEventScope(event, stateManager);

    expect(triggerEvent).to.deep.equal(event);
  });
});

describe('scene triggerEvent in actions', () => {
  const { executeActions } = executeActionsFactory(actionsFunc);

  it('should inject triggerEvent variables in send message action', async () => {
    const stateManager = new StateManager(new EventEmitter());
    stateManager.setState('deviceFeature', 'door-sensor', {
      selector: 'door-sensor',
      name: 'Front door',
      category: 'opening-sensor',
      type: 'binary',
      device_id: 'device-1',
    });
    stateManager.setState('deviceById', 'device-1', {
      selector: 'my-door',
      name: 'Door sensor',
    });

    const message = {
      sendToUser: fake.resolves(null),
    };

    const scope = {
      triggerEvent: buildTriggerEventScope(
        {
          type: EVENTS.DEVICE.NEW_STATE,
          device_feature: 'door-sensor',
          previous_value: 0,
          last_value: 1,
        },
        stateManager,
      ),
    };

    await executeActions(
      { stateManager, message, event: new EventEmitter() },
      [
        [
          {
            type: ACTIONS.MESSAGE.SEND,
            user: 'pepper',
            text:
              'Alert: {{triggerEvent.device.name}} - {{triggerEvent.deviceFeature.name}} is now {{triggerEvent.deviceFeature.last_value}}',
          },
        ],
      ],
      scope,
    );

    assert.calledWith(message.sendToUser, 'pepper', 'Alert: Door sensor - Front door is now 1');
  });
});

describe('scene.checkTrigger triggerEvent', () => {
  let sceneManager;
  const event = new EventEmitter();
  const device = {
    setValue: fake.resolves(null),
  };
  const brain = {};

  beforeEach(() => {
    const stateManager = new StateManager(event);
    stateManager.setState('deviceFeature', 'door-sensor', {
      selector: 'door-sensor',
      name: 'Front door',
      category: 'opening-sensor',
      type: 'binary',
      device_id: 'device-1',
      last_value: 0,
    });
    stateManager.setState('deviceById', 'device-1', {
      selector: 'my-door',
      name: 'Door sensor',
    });

    const message = {
      sendToUser: fake.resolves(null),
    };

    sceneManager = new SceneManager(stateManager, event, device, message, {}, {}, {}, {}, {}, {}, brain);
  });

  it('should pass enriched triggerEvent when scene is triggered by device state', async () => {
    await sceneManager.addScene({
      selector: 'door-scene',
      active: true,
      actions: [
        [
          {
            type: ACTIONS.MESSAGE.SEND,
            user: 'pepper',
            text: 'Opened: {{triggerEvent.deviceFeature.name}}',
          },
        ],
      ],
      triggers: [
        {
          type: EVENTS.DEVICE.NEW_STATE,
          device_feature: 'door-sensor',
          value: 1,
          operator: '=',
        },
      ],
    });

    sceneManager.checkTrigger({
      type: EVENTS.DEVICE.NEW_STATE,
      device_feature: 'door-sensor',
      previous_value: 0,
      last_value: 1,
    });

    await new Promise((resolve, reject) => {
      sceneManager.queue.start(() => {
        try {
          assert.calledWith(sceneManager.message.sendToUser, 'pepper', 'Opened: Front door');
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });
});
