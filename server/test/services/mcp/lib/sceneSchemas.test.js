const { expect } = require('chai');

const {
  flattenSceneActions,
  assertTriggerTypesNotInActions,
  createSceneCreateInputSchema,
} = require('../../../../services/mcp/lib/sceneSchemas');

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
