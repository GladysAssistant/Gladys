const { expect } = require('chai');
const sinon = require('sinon');
const { EVENTS } = require('../../../utils/constants');
const SceneManager = require('../../../lib/scene');

const { fake, assert } = sinon;

describe('SceneManager.cancelTriggers', () => {
  let sceneManager;

  const brain = {};
  const service = {};
  const event = {};
  const mqttService = {
    device: {},
  };

  beforeEach(() => {
    mqttService.device.unsubscribe = fake.returns(null);
    mqttService.device.subscribe = fake.returns(null);
    service.getService = fake.returns(mqttService);

    const house = {
      get: fake.resolves([]),
    };

    const scheduler = {
      scheduleJob: (date, callback) => {
        return {
          callback,
          date,
          cancel: () => {},
        };
      },
    };

    brain.addNamedEntity = fake.returns(null);
    brain.removeNamedEntity = fake.returns(null);

    event.on = fake.returns(null);

    sceneManager = new SceneManager({}, event, {}, {}, {}, house, {}, {}, {}, scheduler, brain, service);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should cancel a node-schedule trigger', async () => {
    const scene = await sceneManager.create({
      name: 'a-test-scene',
      icon: 'bell',
      triggers: [
        {
          type: EVENTS.TIME.CHANGED,
          scheduler_type: 'custom-time',
          date: '2100-01-01',
          time: '12:00',
        },
      ],
      actions: [],
      tags: [],
    });
    expect(sceneManager.scenes[scene.selector].triggers[0]).to.have.property('nodeScheduleJob');
    sceneManager.cancelTriggers(scene.selector);
    expect(sceneManager.scenes[scene.selector].triggers[0]).not.to.have.property('nodeScheduleJob');
  });
  it('should cancel a js interval trigger', async () => {
    const scene = await sceneManager.create({
      name: 'a-test-scene',
      icon: 'bell',
      triggers: [
        {
          type: EVENTS.TIME.CHANGED,
          scheduler_type: 'interval',
          interval: 1000,
          unit: 'minute',
        },
      ],
      actions: [],
      tags: [],
    });
    expect(sceneManager.scenes[scene.selector].triggers[0]).not.to.have.property('nodeScheduleJob');
    expect(sceneManager.scenes[scene.selector].triggers[0]).to.have.property('jsInterval');
    sceneManager.cancelTriggers(scene.selector);
    expect(sceneManager.scenes[scene.selector].triggers[0]).not.to.have.property('jsInterval');
  });
  it('should cancel a message received trigger', async () => {
    const scene = await sceneManager.create({
      name: 'a-test-scene',
      icon: 'bell',
      triggers: [
        {
          type: EVENTS.MQTT.RECEIVED,
          topic: 'my/topic',
        },
      ],
      actions: [],
    });
    expect(sceneManager.scenes[scene.selector].triggers[0]).not.to.have.property('nodeScheduleJob');
    expect(sceneManager.scenes[scene.selector].triggers[0]).not.to.have.property('jsInterval');
    sceneManager.cancelTriggers(scene.selector);
    assert.calledWithExactly(service.getService, 'mqtt');
    assert.calledWithExactly(mqttService.device.unsubscribe, 'my/topic');
  });
});
