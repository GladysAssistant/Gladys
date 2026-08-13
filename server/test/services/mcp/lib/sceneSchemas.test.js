const { expect } = require('chai');

const {
  flattenSceneActions,
  assertTriggerTypesNotInActions,
  createSceneCreateInputSchema,
} = require('../../../../services/mcp/lib/sceneSchemas');

describe('sceneSchemas helpers', () => {
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
