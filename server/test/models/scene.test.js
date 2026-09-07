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
});
