const { expect } = require('chai');

const {
  flattenSceneActions,
  assertTriggerTypesNotInActions,
  createSceneCreateInputSchema,
} = require('../../../../services/mcp/lib/sceneSchemas');
const { ACTIONS, EVENTS, MESSAGE_GLADYS_ONLY_SERVICE } = require('../../../../utils/constants');

describe('sceneSchemas helpers', () => {
  it('should accept a variable.set action', () => {
    const schema = createSceneCreateInputSchema();
    const result = schema.safeParse({
      name: 'My scene',
      icon: 'lightbulb',
      triggers: [{ type: 'system.start' }],
      actions: [
        [{ type: 'variable.set', name: 'Waiting time', evaluate_value: '{{0.0.last_value}} * 2' }],
        [{ type: 'variable.set', text: 'Hello' }],
      ],
    });
    expect(result.success).to.equal(true);
  });

  it('should reject a variable.set action setting both a text and a formula', () => {
    const schema = createSceneCreateInputSchema();
    const result = schema.safeParse({
      name: 'My scene',
      icon: 'lightbulb',
      triggers: [{ type: 'system.start' }],
      actions: [[{ type: 'variable.set', text: 'Hello', evaluate_value: '2 * 3' }]],
    });
    expect(result.success).to.equal(false);
  });

  it('should accept a channel on an ai.ask action, like the send message actions', () => {
    const schema = createSceneCreateInputSchema();
    // the three cases of the `service` property must be authorable by the AI
    // too, otherwise a scene built in the UI cannot be copied through scene.create
    [MESSAGE_GLADYS_ONLY_SERVICE, 'telegram', null, undefined].forEach((service) => {
      const result = schema.safeParse({
        name: 'My scene',
        icon: 'lightbulb',
        triggers: [{ type: 'system.start' }],
        actions: [[{ type: ACTIONS.AI.ASK, user: 'john', text: 'Is the living room too hot?', service }]],
      });
      expect(result.success, `service: ${service}`).to.equal(true);
    });
  });

  it('should reject an unknown property on an ai.ask action', () => {
    const schema = createSceneCreateInputSchema();
    const result = schema.safeParse({
      name: 'My scene',
      icon: 'lightbulb',
      triggers: [{ type: 'system.start' }],
      actions: [[{ type: ACTIONS.AI.ASK, user: 'john', text: 'Hello', unknown_property: 'nope' }]],
    });
    expect(result.success).to.equal(false);
  });

  it('should flatten nested scene actions and ignore invalid entries', () => {
    expect(flattenSceneActions(null)).to.deep.equal([]);
    expect(flattenSceneActions('invalid')).to.deep.equal([]);
    expect(
      flattenSceneActions([
        [[{ type: 'delay', unit: 'minutes', value: 1 }]],
        { type: 'light.turn-on', devices: ['light-1'] },
        'ignored',
      ]),
    ).to.deep.equal([
      { type: 'delay', unit: 'minutes', value: 1 },
      { type: 'light.turn-on', devices: ['light-1'] },
    ]);
  });

  it('should allow trigger types in triggers only', () => {
    expect(() =>
      assertTriggerTypesNotInActions({
        triggers: [{ type: 'system.start' }],
        actions: [[{ type: 'delay', unit: 'minutes', value: 1 }]],
      }),
    ).to.not.throw();
    expect(() => assertTriggerTypesNotInActions({})).to.not.throw();
    expect(() => assertTriggerTypesNotInActions(null)).to.not.throw();
  });

  it('should reject trigger types placed in actions', () => {
    let error = null;
    try {
      assertTriggerTypesNotInActions({
        actions: [[{ type: 'device.new-state', device_feature: 'mqtt-lumiere', operator: '=', value: 1 }]],
      });
    } catch (e) {
      error = e;
    }
    expect(error).to.be.an('error');
    expect(error.message).to.contain('must be in the top-level triggers array');
  });
});

describe('sceneSchemas external integration scene trigger and action', () => {
  const schema = createSceneCreateInputSchema();
  const baseScene = {
    name: 'Frigate scene',
    icon: 'bell',
    triggers: [
      {
        type: EVENTS.EXTERNAL_INTEGRATION.SCENE_EVENT,
        integration: 'ext-frigate',
        trigger_key: 'object_detected',
        fields: { camera: 'ext:frigate:front', label: ['person', 'car'], zone: null, min_score: 0.5 },
      },
    ],
    actions: [
      [
        {
          type: ACTIONS.EXTERNAL_INTEGRATION.SCENE_ACTION,
          integration: 'ext-frigate',
          action_key: 'create_snapshot',
          fields: { camera: 'ext:frigate:front', caption: '{{triggerEvent.data.label}}', hd: true },
        },
      ],
    ],
  };

  it('should accept the two types with a fields passthrough', () => {
    expect(schema.safeParse(baseScene).success).to.equal(true);
    expect(
      schema.safeParse({
        ...baseScene,
        triggers: [{ ...baseScene.triggers[0], fields: undefined }],
        actions: [[{ ...baseScene.actions[0][0], fields: undefined }]],
      }).success,
    ).to.equal(true);
  });

  it('should enforce the key format and the field count of the scene model', () => {
    expect(
      schema.safeParse({ ...baseScene, triggers: [{ ...baseScene.triggers[0], trigger_key: 'Object Detected' }] })
        .success,
    ).to.equal(false);
    expect(
      schema.safeParse({ ...baseScene, actions: [[{ ...baseScene.actions[0][0], action_key: 'Snap!' }]] }).success,
    ).to.equal(false);
    expect(
      schema.safeParse({ ...baseScene, triggers: [{ ...baseScene.triggers[0], fields: { 'Bad-Key': 'x' } }] }).success,
    ).to.equal(false);
    const tooManyFields = Object.fromEntries(Array.from({ length: 11 }, (value, index) => [`k${index}`, 'x']));
    expect(
      schema.safeParse({ ...baseScene, triggers: [{ ...baseScene.triggers[0], fields: tooManyFields }] }).success,
    ).to.equal(false);
    const tenFields = Object.fromEntries(Array.from({ length: 10 }, (value, index) => [`k${index}`, 'x']));
    expect(
      schema.safeParse({ ...baseScene, triggers: [{ ...baseScene.triggers[0], fields: tenFields }] }).success,
    ).to.equal(true);
  });

  it('should reject a nested field value and a missing key', () => {
    expect(
      schema.safeParse({
        ...baseScene,
        triggers: [{ ...baseScene.triggers[0], fields: { camera: { nested: true } } }],
      }).success,
    ).to.equal(false);
    expect(
      schema.safeParse({
        ...baseScene,
        actions: [[{ type: ACTIONS.EXTERNAL_INTEGRATION.SCENE_ACTION, integration: 'ext-frigate' }]],
      }).success,
    ).to.equal(false);
  });

  it('should keep the scene event type a trigger, never an action', () => {
    expect(() =>
      assertTriggerTypesNotInActions({ actions: [[{ type: EVENTS.EXTERNAL_INTEGRATION.SCENE_EVENT }]] }),
    ).to.throw('must be in the top-level triggers array');
  });
});

describe('sceneSchemas time.get-date action', () => {
  const schema = createSceneCreateInputSchema();
  const buildScene = (action) => ({
    name: 'Tell me the time',
    icon: 'clock',
    triggers: [{ type: 'system.start' }],
    actions: [[{ type: ACTIONS.TIME.GET_DATE, ...action }]],
  });

  it('should accept an action without precision', () => {
    expect(schema.safeParse(buildScene({})).success).to.equal(true);
  });

  it('should accept an action with a precision', () => {
    expect(schema.safeParse(buildScene({ precision: 'day' })).success).to.equal(true);
  });

  it('should reject an action with an unknown precision', () => {
    expect(schema.safeParse(buildScene({ precision: 'century' })).success).to.equal(false);
  });
});

describe('sceneSchemas calendar.get-events action', () => {
  const schema = createSceneCreateInputSchema();
  const buildScene = (action) => ({
    name: 'Announce my agenda',
    icon: 'activity',
    triggers: [{ type: 'system.start' }],
    actions: [[{ type: ACTIONS.CALENDAR.GET_EVENTS, calendars: ['my-calendar'], ...action }]],
  });

  it('should accept a today range without a duration', () => {
    expect(schema.safeParse(buildScene({ time_range: 'today' })).success).to.equal(true);
  });

  it('should accept a tomorrow range without a duration', () => {
    expect(schema.safeParse(buildScene({ time_range: 'tomorrow' })).success).to.equal(true);
  });

  it('should reject an invalid time range', () => {
    expect(schema.safeParse(buildScene({ time_range: 'next-week' })).success).to.equal(false);
  });

  it('should reject an action without calendars', () => {
    expect(schema.safeParse(buildScene({ time_range: 'today', calendars: [] })).success).to.equal(false);
  });

  it('should reject an invalid stop_scene_if_no_events', () => {
    expect(schema.safeParse(buildScene({ time_range: 'today', stop_scene_if_no_events: 'yes' })).success).to.equal(
      false,
    );
  });

  it('should accept a next-x-hours range with a duration', () => {
    expect(schema.safeParse(buildScene({ time_range: 'next-x-hours', duration: 12 })).success).to.equal(true);
  });

  it('should reject a next-x-hours range without a duration', () => {
    expect(schema.safeParse(buildScene({ time_range: 'next-x-hours' })).success).to.equal(false);
  });

  it('should reject a next-x-hours range with a duration lower than one hour', () => {
    expect(schema.safeParse(buildScene({ time_range: 'next-x-hours', duration: 0 })).success).to.equal(false);
  });

  it('should reject a next-x-hours range with a fractional duration', () => {
    expect(schema.safeParse(buildScene({ time_range: 'next-x-hours', duration: 1.5 })).success).to.equal(false);
  });

  it('should reject a next-x-hours range with an explicit null duration', () => {
    expect(schema.safeParse(buildScene({ time_range: 'next-x-hours', duration: null })).success).to.equal(false);
  });
});

describe('sceneSchemas device.new-state trigger', () => {
  const schema = createSceneCreateInputSchema();
  const buildScene = (trigger) => ({
    name: 'Test scene',
    icon: 'bell',
    triggers: [trigger],
    actions: [[{ type: 'delay', unit: 'minutes', value: 1 }]],
  });

  it('should accept a legacy single device_feature trigger', () => {
    const result = schema.safeParse(
      buildScene({ type: 'device.new-state', device_feature: 'mqtt-lumiere', operator: '=', value: 1 }),
    );
    expect(result.success).to.equal(true);
  });

  it('should accept a non-empty device_features trigger with shared condition fields', () => {
    const result = schema.safeParse(
      buildScene({
        type: 'device.new-state',
        device_features: ['motion-sensor-1', 'motion-sensor-2'],
        operator: '=',
        value: 1,
        threshold_only: true,
        for_duration: 2700000,
      }),
    );
    expect(result.success).to.equal(true);
  });

  it('should reject an empty device_features array', () => {
    const result = schema.safeParse(
      buildScene({ type: 'device.new-state', device_features: [], operator: '=', value: 1 }),
    );
    expect(result.success).to.equal(false);
  });

  it('should reject a trigger with neither device_feature nor device_features', () => {
    const result = schema.safeParse(buildScene({ type: 'device.new-state', operator: '=', value: 1 }));
    expect(result.success).to.equal(false);
  });

  it('should accept a "changed" trigger without value on a single device_feature', () => {
    const result = schema.safeParse(
      buildScene({ type: 'device.new-state', device_feature: 'mqtt-thermostat', operator: 'changed' }),
    );
    expect(result.success).to.equal(true);
  });

  it('should accept a "changed" trigger without value on several device_features', () => {
    const result = schema.safeParse(
      buildScene({
        type: 'device.new-state',
        device_features: ['mqtt-thermostat-1', 'mqtt-thermostat-2'],
        operator: 'changed',
      }),
    );
    expect(result.success).to.equal(true);
  });

  it('should reject a "changed" trigger with a value, a threshold or a duration', () => {
    expect(
      schema.safeParse(
        buildScene({ type: 'device.new-state', device_feature: 'mqtt-thermostat', operator: 'changed', value: 1 }),
      ).success,
    ).to.equal(false);
    expect(
      schema.safeParse(
        buildScene({
          type: 'device.new-state',
          device_feature: 'mqtt-thermostat',
          operator: 'changed',
          threshold_only: true,
        }),
      ).success,
    ).to.equal(false);
    expect(
      schema.safeParse(
        buildScene({
          type: 'device.new-state',
          device_feature: 'mqtt-thermostat',
          operator: 'changed',
          for_duration: 2700000,
        }),
      ).success,
    ).to.equal(false);
  });

  it('should reject a trigger mixing device_feature and device_features', () => {
    const result = schema.safeParse(
      buildScene({
        type: 'device.new-state',
        device_feature: 'mqtt-lumiere',
        device_features: ['motion-sensor-1'],
        operator: '=',
        value: 1,
      }),
    );
    expect(result.success).to.equal(false);
  });
});
