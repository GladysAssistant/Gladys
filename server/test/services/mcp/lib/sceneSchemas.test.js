const { expect } = require('chai');

const {
  flattenSceneActions,
  assertTriggerTypesNotInActions,
  createSceneCreateInputSchema,
} = require('../../../../services/mcp/lib/sceneSchemas');

const buildSceneWithCondition = (condition) => ({
  name: 'My scene',
  icon: 'bell',
  triggers: [{ type: 'system.start' }],
  actions: [[{ type: 'condition.only-continue-if', conditions: [condition] }]],
});

describe('sceneSchemas condition', () => {
  const schema = createSceneCreateInputSchema();

  it('should accept a condition with only a variable', () => {
    const result = schema.safeParse(buildSceneWithCondition({ variable: '0.0.last_value', operator: '>', value: 20 }));
    expect(result.success).to.equal(true);
  });

  it('should accept a condition with only a device feature', () => {
    const result = schema.safeParse(
      buildSceneWithCondition({ device_feature: 'mqtt-temperature', operator: '>', value: 20 }),
    );
    expect(result.success).to.equal(true);
  });

  it('should reject a condition with neither a variable nor a device feature', () => {
    const result = schema.safeParse(buildSceneWithCondition({ operator: '>', value: 20 }));
    expect(result.success).to.equal(false);
  });

  it('should reject a condition with both a variable and a device feature', () => {
    const result = schema.safeParse(
      buildSceneWithCondition({
        variable: '0.0.last_value',
        device_feature: 'mqtt-temperature',
        operator: '>',
        value: 20,
      }),
    );
    expect(result.success).to.equal(false);
  });
});

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
