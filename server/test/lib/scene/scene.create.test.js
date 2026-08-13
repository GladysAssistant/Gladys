const { assert, expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;
const EventEmitter = require('events');
const { ACTIONS } = require('../../../utils/constants');
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

  it('should format joi error fallback when details are absent', () => {
    expect(sceneModel.formatJoiValidationError()).to.equal('Invalid schema');
    expect(sceneModel.formatJoiValidationError({ message: 'Validation failed' })).to.equal('Validation failed');
  });
});
