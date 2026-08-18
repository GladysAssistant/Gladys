const { assert, expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;
const EventEmitter = require('events');
const { ACTIONS, ANY_CHANGE_OPERATOR, EVENTS } = require('../../../utils/constants');
const SceneManager = require('../../../lib/scene');
const sceneModel = require('../../../models/scene');

const event = new EventEmitter();

describe('SceneManager', () => {
  const brain = {};
  let sceneManager;
  beforeEach(() => {
    brain.addNamedEntity = fake.returns(null);
    brain.removeNamedEntity = fake.returns(null);
    sceneManager = new SceneManager({}, event, {}, {}, {}, {}, {}, {}, {}, {}, brain);
  });
  it('should create one scene', async () => {
    const scene = await sceneManager.create({
      name: 'My living room',
      icon: 'bell',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
          },
        ],
      ],
      tags: [],
    });
    expect(scene).to.have.property('selector');
    expect(scene.selector).to.contain('my-living-room');
    // selector should have 4 random characters at the end + dash
    expect(scene.selector).to.have.lengthOf('my-living-room'.length + 5);
  });
  it('should create one scene with custom selector', async () => {
    const scene = await sceneManager.create({
      name: 'My living room',
      icon: 'bell',
      selector: 'my-custom-selector',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
          },
        ],
      ],
      tags: [],
    });
    expect(scene).to.have.property('selector', 'my-custom-selector');
  });
  it('should create one scene with a text value in a device.set-value action', async () => {
    const scene = await sceneManager.create({
      name: 'Send message to TV',
      icon: 'bell',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.DEVICE.SET_VALUE,
            device_feature: 'my-tv-text-feature',
            value: 'The meal is ready!',
          },
        ],
      ],
      tags: [],
    });
    expect(scene).to.have.property('selector');
  });
  it('should return validation error, invalid actions', async () => {
    const promise = sceneManager.create({
      name: 'My living room',
      icon: 'bell',
      triggers: [],
      actions: [
        {
          type: ACTIONS.LIGHT.TURN_ON,
        },
      ],
      tags: [],
    });
    await assert.isRejected(promise);
  });

  it('should return validation error, invalid triggers', async () => {
    const promise = sceneManager.create({
      name: 'Invalid trigger scene',
      icon: 'bell',
      triggers: [
        {
          type: 'invalid-trigger-type',
        },
      ],
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
          },
        ],
      ],
      tags: [],
    });
    await assert.isRejected(promise);
  });

  it('should create one scene with an "any state change" trigger', async () => {
    const scene = await sceneManager.create({
      name: 'Any state change scene',
      icon: 'bell',
      triggers: [
        {
          type: EVENTS.DEVICE.NEW_STATE,
          device_features: ['my-thermostat-mode'],
          operator: ANY_CHANGE_OPERATOR,
        },
      ],
      actions: [
        [
          {
            type: ACTIONS.LIGHT.TURN_ON,
          },
        ],
      ],
      tags: [],
    });
    expect(scene).to.have.property('selector');
  });

  // A "changed" trigger compares the new state with the previous one: there is no value to
  // match, and neither the threshold nor the duration option applies to an instantaneous change
  const invalidAnyChangeProperties = [
    { key: 'value', value: 1 },
    { key: 'threshold_only', value: true },
    { key: 'for_duration', value: 2700000 },
  ];
  invalidAnyChangeProperties.forEach(({ key, value }) => {
    it(`should return validation error, "any state change" trigger with a ${key}`, async () => {
      const promise = sceneManager.create({
        name: `Invalid any state change scene with ${key}`,
        icon: 'bell',
        triggers: [
          {
            type: EVENTS.DEVICE.NEW_STATE,
            device_features: ['my-thermostat-mode'],
            operator: ANY_CHANGE_OPERATOR,
            [key]: value,
          },
        ],
        actions: [
          [
            {
              type: ACTIONS.LIGHT.TURN_ON,
            },
          ],
        ],
        tags: [],
      });
      await assert.isRejected(promise);
    });
  });

  it('should return validation error when http.request action has no headers', async () => {
    const promise = sceneManager.create({
      name: 'Invalid http request scene',
      icon: 'bell',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.HTTP.REQUEST,
            method: 'post',
            url: 'https://example.com/hook',
          },
        ],
      ],
      tags: [],
    });
    await assert.isRejected(promise);
  });

  it('should return validation error when variable.set action has both a text and a formula', async () => {
    const promise = sceneManager.create({
      name: 'Ambiguous variable scene',
      icon: 'bell',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.VARIABLE.SET,
            text: 'Hello',
            evaluate_value: '2 * 3',
          },
        ],
      ],
      tags: [],
    });
    await assert.isRejected(promise, /conflict between optional exclusive peers \[text, evaluate_value\]/);
  });

  it('should create one scene with a variable.set action', async () => {
    const scene = await sceneManager.create({
      name: 'Variable scene',
      icon: 'bell',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.VARIABLE.SET,
            evaluate_value: '2 * 3',
          },
        ],
      ],
      tags: [],
    });
    expect(scene).to.have.property('selector');
  });

  it('should create a scene with a calendar.get-events action', async () => {
    const scene = await sceneManager.create({
      name: 'Announce my agenda',
      icon: 'bell',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.CALENDAR.GET_EVENTS,
            calendars: ['test-calendar'],
            time_range: 'tomorrow',
            stop_scene_if_no_events: true,
            // Null is accepted so the action can be saved before the user
            // has filled the number of hours.
            duration: null,
          },
        ],
      ],
      tags: [],
    });
    expect(scene).to.have.property('selector');
  });

  it('should return validation error when calendar.get-events has an invalid time range', async () => {
    const promise = sceneManager.create({
      name: 'Invalid calendar scene',
      icon: 'bell',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.CALENDAR.GET_EVENTS,
            calendars: ['test-calendar'],
            time_range: 'next-week',
          },
        ],
      ],
      tags: [],
    });
    await assert.isRejected(promise);
  });

  it('should return validation error when calendar.get-events has a fractional duration', async () => {
    const promise = sceneManager.create({
      name: 'Invalid calendar scene',
      icon: 'bell',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.CALENDAR.GET_EVENTS,
            calendars: ['test-calendar'],
            time_range: 'next-x-hours',
            duration: 1.5,
          },
        ],
      ],
      tags: [],
    });
    await assert.isRejected(promise);
  });

  it('should create a scene with a time.get-date action', async () => {
    const scene = await sceneManager.create({
      name: 'What time is it',
      icon: 'bell',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.TIME.GET_DATE,
            precision: 'minute',
          },
        ],
      ],
      tags: [],
    });
    expect(scene).to.have.property('selector');
  });

  it('should return validation error when time.get-date has an unknown precision', async () => {
    const promise = sceneManager.create({
      name: 'Invalid get date scene',
      icon: 'bell',
      triggers: [],
      actions: [
        [
          {
            type: ACTIONS.TIME.GET_DATE,
            precision: 'century',
          },
        ],
      ],
      tags: [],
    });
    await assert.isRejected(promise);
  });

  it('should format joi error fallback when details are absent', () => {
    expect(sceneModel.formatJoiValidationError()).to.equal('Invalid schema');
    expect(sceneModel.formatJoiValidationError({ message: 'Validation failed' })).to.equal('Validation failed');
  });
});
