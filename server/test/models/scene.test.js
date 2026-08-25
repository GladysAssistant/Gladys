const { assert } = require('chai');

const db = require('../../models');
const { ACTIONS, ANY_CHANGE_OPERATOR, EVENTS } = require('../../utils/constants');

// db.Scene.build(...).validate() runs the model validators (and the beforeValidate
// hook building the selector) without touching the database: it exercises the Joi
// schemas of the model itself, where SceneManager.create goes through the whole
// create flow.
const buildScene = (trigger) =>
  db.Scene.build({
    name: 'Any state change scene',
    icon: 'bell',
    triggers: [trigger],
    actions: [
      [
        {
          type: ACTIONS.LIGHT.TURN_ON,
        },
      ],
    ],
  });

describe('models/scene', () => {
  it('should validate an "any state change" trigger', async () => {
    await buildScene({
      type: EVENTS.DEVICE.NEW_STATE,
      device_features: ['my-thermostat-mode'],
      operator: ANY_CHANGE_OPERATOR,
    }).validate();
  });

  // A "changed" trigger compares the new state with the previous one: there is no value to
  // match, and neither the threshold nor the duration option applies to an instantaneous change
  const invalidAnyChangeProperties = [
    { key: 'value', value: 1 },
    { key: 'threshold_only', value: true },
    { key: 'for_duration', value: 2700000 },
  ];
  invalidAnyChangeProperties.forEach(({ key, value }) => {
    it(`should reject an "any state change" trigger with a ${key}`, async () => {
      const promise = buildScene({
        type: EVENTS.DEVICE.NEW_STATE,
        device_features: ['my-thermostat-mode'],
        operator: ANY_CHANGE_OPERATOR,
        [key]: value,
      }).validate();
      await assert.isRejected(promise, `"[0].${key}" is not allowed`);
    });
  });

  describe('time-range trigger', () => {
    it('should validate a time-range trigger', async () => {
      await buildScene({
        type: EVENTS.TIME.CHANGED,
        scheduler_type: 'time-range',
        days_of_the_week: ['monday', 'tuesday'],
        time_ranges: [
          { start: '12:00', end: '14:30' },
          { start: '16:00', end: '17:30' },
        ],
        resume_on_startup: true,
      }).validate();
    });

    // Fields written by earlier iterations of this feature. The trigger schema rejects
    // anything it does not know, so a scene holding them could no longer be saved nor
    // duplicated: they must stay accepted (and stripped) rather than break the scene.
    const legacyProperties = [
      { key: 'trigger_start', value: true },
      { key: 'trigger_end', value: false },
    ];
    legacyProperties.forEach(({ key, value }) => {
      it(`should still accept a time-range trigger holding a legacy "${key}"`, async () => {
        await buildScene({
          type: EVENTS.TIME.CHANGED,
          scheduler_type: 'time-range',
          days_of_the_week: ['monday'],
          time_ranges: [{ start: '12:00', end: '14:30' }],
          [key]: value,
        }).validate();
      });
    });

    it('should still accept days of the week carried by a range', async () => {
      await buildScene({
        type: EVENTS.TIME.CHANGED,
        scheduler_type: 'time-range',
        time_ranges: [{ start: '12:00', end: '14:30', days_of_the_week: ['monday'] }],
      }).validate();
    });

    it('should reject a range without an end', async () => {
      const promise = buildScene({
        type: EVENTS.TIME.CHANGED,
        scheduler_type: 'time-range',
        time_ranges: [{ start: '12:00' }],
      }).validate();
      await assert.isRejected(promise, '"[0].time_ranges[0].end" is required');
    });

    it('should reject a trigger without any range', async () => {
      const promise = buildScene({
        type: EVENTS.TIME.CHANGED,
        scheduler_type: 'time-range',
        time_ranges: [],
      }).validate();
      await assert.isRejected(promise, 'at least one time range');
    });

    it('should reject a trigger where every day was unselected', async () => {
      const promise = buildScene({
        type: EVENTS.TIME.CHANGED,
        scheduler_type: 'time-range',
        days_of_the_week: [],
        time_ranges: [{ start: '12:00', end: '14:30' }],
      }).validate();
      await assert.isRejected(promise, 'at least one day of the week');
    });

    it('should reject a range starting and ending at the same time', async () => {
      const promise = buildScene({
        type: EVENTS.TIME.CHANGED,
        scheduler_type: 'time-range',
        time_ranges: [{ start: '12:00', end: '12:00' }],
      }).validate();
      await assert.isRejected(promise, 'cannot start and end at the same time');
    });

    // A loose HH:mm regex accepts these, and node-schedule then builds a rule which never
    // fires: the trigger would be silently dead.
    ['99:99', '12:75', '24:00'].forEach((time) => {
      it(`should reject the impossible time "${time}"`, async () => {
        const promise = buildScene({
          type: EVENTS.TIME.CHANGED,
          scheduler_type: 'time-range',
          time_ranges: [{ start: time, end: '20:00' }],
        }).validate();
        await assert.isRejected(promise, '"[0].time_ranges[0].start"');
      });
    });

    // The other trigger types must not be affected by the time-range rules.
    it('should still validate a classic every-day trigger', async () => {
      await buildScene({
        type: EVENTS.TIME.CHANGED,
        scheduler_type: 'every-day',
        time: '09:00',
      }).validate();
    });

    it('should reject a badly formatted time', async () => {
      const promise = buildScene({
        type: EVENTS.TIME.CHANGED,
        scheduler_type: 'time-range',
        time_ranges: [{ start: '12h00', end: '14:30' }],
      }).validate();
      await assert.isRejected(promise, '"[0].time_ranges[0].start"');
    });
  });
});
