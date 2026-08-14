const { expect } = require('chai');

const {
  flattenSceneActions,
  assertTriggerTypesNotInActions,
  createSceneCreateInputSchema,
} = require('../../../../services/mcp/lib/sceneSchemas');
const { ACTIONS } = require('../../../../utils/constants');

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
