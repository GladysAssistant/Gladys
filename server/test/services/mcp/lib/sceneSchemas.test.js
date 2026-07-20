const { expect } = require('chai');

const { flattenSceneActions, assertTriggerTypesNotInActions } = require('../../../../services/mcp/lib/sceneSchemas');

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
