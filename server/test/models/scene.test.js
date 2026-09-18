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

const buildSceneWithActions = (actions) =>
  db.Scene.build({
    name: 'Integration scene',
    icon: 'bell',
    triggers: [],
    actions,
  });

describe('models/scene', () => {
  it('should validate an external integration scene trigger and action', async () => {
    await buildScene({
      type: EVENTS.EXTERNAL_INTEGRATION.SCENE_EVENT,
      integration: 'ext-frigate',
      trigger_key: 'object_detected',
      fields: { camera: 'ext:frigate:front', label: ['person', 'car'], zone: null, min_score: 0.5, empty: '' },
    }).validate();
    await buildSceneWithActions([
      [
        {
          type: ACTIONS.EXTERNAL_INTEGRATION.SCENE_ACTION,
          integration: 'ext-frigate',
          action_key: 'create_snapshot',
          fields: { camera: 'ext:frigate:front', caption: 'Visitor: {{triggerEvent.data.label}}', hd: true },
        },
      ],
    ]).validate();
  });

  it('should validate a stored external integration trigger without fields', async () => {
    await buildScene({
      type: EVENTS.EXTERNAL_INTEGRATION.SCENE_EVENT,
      integration: 'ext-frigate',
      trigger_key: 'doorbell_pressed',
    }).validate();
  });

  // the manifest is never consulted at save time: the shape only is checked
  const invalidFields = [
    { name: 'a nested value', fields: { camera: { nested: true } } },
    { name: 'a bad key', fields: { 'Bad-Key': 'x' } },
    { name: 'an array of objects', fields: { label: [{ value: 'person' }] } },
    {
      name: 'more than 10 keys',
      fields: Object.fromEntries(Array.from({ length: 11 }, (value, index) => [`k${index}`, 'x'])),
    },
  ];
  invalidFields.forEach(({ name, fields }) => {
    it(`should reject an external integration trigger with ${name}`, async () => {
      const promise = buildScene({
        type: EVENTS.EXTERNAL_INTEGRATION.SCENE_EVENT,
        integration: 'ext-frigate',
        trigger_key: 'object_detected',
        fields,
      }).validate();
      await assert.isRejected(promise, '"[0].fields');
    });
  });

  it('should reject a declared key outside the manifest key format', async () => {
    const triggerPromise = buildScene({
      type: EVENTS.EXTERNAL_INTEGRATION.SCENE_EVENT,
      integration: 'ext-frigate',
      trigger_key: 'Object Detected',
    }).validate();
    await assert.isRejected(triggerPromise, '"[0].trigger_key"');
    const actionPromise = buildSceneWithActions([
      [{ type: ACTIONS.EXTERNAL_INTEGRATION.SCENE_ACTION, integration: 'ext-frigate', action_key: 'Snap!' }],
    ]).validate();
    await assert.isRejected(actionPromise, '"[0][0].action_key"');
  });

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
});
