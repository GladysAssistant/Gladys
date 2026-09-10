const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const migration = require('../../migrations/20260910090000-alarm-modes-presence-night-away');
const { ACTIONS, ALARM_MODES, EVENTS } = require('../../utils/constants');

describe('migration 20260910090000-alarm-modes-presence-night-away', () => {
  afterEach(() => {
    sinon.reset();
  });

  describe('migrateAction', () => {
    it('should rename the modes a scene sets', () => {
      expect(
        migration.migrateAction({ type: ACTIONS.ALARM.SET_ALARM_MODE, house: 'main', alarm_mode: 'partially-armed' }),
      ).to.deep.equal({
        type: ACTIONS.ALARM.SET_ALARM_MODE,
        house: 'main',
        alarm_mode: ALARM_MODES.PRESENCE_ARMED,
      });
      expect(
        migration.migrateAction({ type: ACTIONS.ALARM.SET_ALARM_MODE, house: 'main', alarm_mode: 'armed' }),
      ).to.deep.equal({
        type: ACTIONS.ALARM.SET_ALARM_MODE,
        house: 'main',
        alarm_mode: ALARM_MODES.AWAY_ARMED,
      });
    });

    it('should rename the modes a scene checks, panic included', () => {
      expect(
        migration.migrateAction({ type: ACTIONS.ALARM.CHECK_ALARM_MODE, house: 'main', alarm_mode: 'panic' }),
      ).to.deep.equal({
        type: ACTIONS.ALARM.CHECK_ALARM_MODE,
        house: 'main',
        alarm_mode: ALARM_MODES.TRIGGERED,
      });
    });

    it('should turn setting the alarm to panic into the panic action', () => {
      expect(
        migration.migrateAction({ type: ACTIONS.ALARM.SET_ALARM_MODE, house: 'main', alarm_mode: 'panic' }),
      ).to.deep.equal({ type: ACTIONS.ALARM.TRIGGER_PANIC, house: 'main' });
    });

    it('should leave an untouched mode and an unrelated action alone', () => {
      const disarm = { type: ACTIONS.ALARM.SET_ALARM_MODE, house: 'main', alarm_mode: ALARM_MODES.DISARMED };
      expect(migration.migrateAction(disarm)).to.deep.equal(disarm);
      const light = { type: 'light.turn-on', devices: ['lamp'] };
      expect(migration.migrateAction(light)).to.deep.equal(light);
      expect(migration.migrateAction(null)).to.equal(null);
    });

    it('should reach the actions nested in an if/then/else block', () => {
      const migrated = migration.migrateAction({
        type: 'condition.if-then-else',
        if: [{ type: ACTIONS.ALARM.CHECK_ALARM_MODE, house: 'main', alarm_mode: 'armed' }],
        then: [[{ type: ACTIONS.ALARM.SET_ALARM_MODE, house: 'main', alarm_mode: 'panic' }]],
        else: [[{ type: ACTIONS.ALARM.SET_ALARM_MODE, house: 'main', alarm_mode: 'partially-armed' }], 'not-an-array'],
      });

      expect(migrated.if[0].alarm_mode).to.equal(ALARM_MODES.AWAY_ARMED);
      expect(migrated.then[0][0]).to.deep.equal({ type: ACTIONS.ALARM.TRIGGER_PANIC, house: 'main' });
      expect(migrated.else[0][0].alarm_mode).to.equal(ALARM_MODES.PRESENCE_ARMED);
      expect(migrated.else[1]).to.equal('not-an-array');
    });
  });

  describe('migrateTrigger', () => {
    it('should rename the two arming triggers', () => {
      expect(migration.migrateTrigger({ type: 'alarm.partial-arm', house: 'main' })).to.deep.equal({
        type: EVENTS.ALARM.PRESENCE_ARM,
        house: 'main',
      });
      expect(migration.migrateTrigger({ type: 'alarm.arm', house: 'main' })).to.deep.equal({
        type: EVENTS.ALARM.AWAY_ARM,
        house: 'main',
      });
    });

    it('should leave the other triggers alone', () => {
      const panic = { type: EVENTS.ALARM.PANIC, house: 'main' };
      expect(migration.migrateTrigger(panic)).to.deep.equal(panic);
      expect(migration.migrateTrigger(null)).to.equal(null);
    });
  });

  describe('up', () => {
    const buildQueryInterface = (scenes) => {
      const query = sinon.stub();
      query.withArgs('SELECT id, actions, triggers FROM t_scene').resolves([scenes]);
      query.resolves();
      return { sequelize: { query } };
    };

    it('should rewrite the alarm mode of every house', async () => {
      const queryInterface = buildQueryInterface([]);

      await migration.up(queryInterface);

      const houseUpdates = queryInterface.sequelize.query
        .getCalls()
        .filter((call) => call.args[0].startsWith('UPDATE t_house'))
        .map((call) => call.args[1].replacements);

      expect(houseUpdates).to.have.deep.members([
        { oldMode: 'partially-armed', newMode: ALARM_MODES.PRESENCE_ARMED },
        { oldMode: 'armed', newMode: ALARM_MODES.AWAY_ARMED },
        { oldMode: 'panic', newMode: ALARM_MODES.TRIGGERED },
      ]);
    });

    it('should rewrite the scenes that mention the alarm, and only those', async () => {
      const queryInterface = buildQueryInterface([
        {
          id: 'scene-with-alarm',
          actions: JSON.stringify([[{ type: ACTIONS.ALARM.SET_ALARM_MODE, house: 'main', alarm_mode: 'armed' }]]),
          triggers: JSON.stringify([{ type: 'alarm.partial-arm', house: 'main' }]),
        },
        {
          id: 'scene-without-alarm',
          actions: JSON.stringify([[{ type: 'light.turn-on', devices: ['lamp'] }]]),
          triggers: JSON.stringify([{ type: 'device.new-state', device_feature: 'sensor' }]),
        },
      ]);

      await migration.up(queryInterface);

      const sceneUpdates = queryInterface.sequelize.query
        .getCalls()
        .filter((call) => call.args[0].startsWith('UPDATE t_scene'));

      expect(sceneUpdates).to.have.lengthOf(1);
      const { id, actions, triggers } = sceneUpdates[0].args[1].replacements;
      expect(id).to.equal('scene-with-alarm');
      expect(JSON.parse(actions)[0][0].alarm_mode).to.equal(ALARM_MODES.AWAY_ARMED);
      expect(JSON.parse(triggers)[0].type).to.equal(EVENTS.ALARM.PRESENCE_ARM);
    });

    it('should accept actions and triggers already parsed by the driver', async () => {
      const queryInterface = buildQueryInterface([
        {
          id: 'scene-parsed',
          actions: [[{ type: ACTIONS.ALARM.SET_ALARM_MODE, house: 'main', alarm_mode: 'panic' }]],
          triggers: [{ type: 'alarm.arm', house: 'main' }],
        },
      ]);

      await migration.up(queryInterface);

      const sceneUpdate = queryInterface.sequelize.query
        .getCalls()
        .find((call) => call.args[0].startsWith('UPDATE t_scene'));

      expect(JSON.parse(sceneUpdate.args[1].replacements.actions)[0][0]).to.deep.equal({
        type: ACTIONS.ALARM.TRIGGER_PANIC,
        house: 'main',
      });
      expect(JSON.parse(sceneUpdate.args[1].replacements.triggers)[0].type).to.equal(EVENTS.ALARM.AWAY_ARM);
    });

    it('should skip a scene holding unparseable JSON rather than abort the migration', async () => {
      const queryInterface = buildQueryInterface([
        { id: 'scene-corrupt', actions: '{not json', triggers: null },
        {
          id: 'scene-ok',
          actions: JSON.stringify([[{ type: ACTIONS.ALARM.SET_ALARM_MODE, house: 'main', alarm_mode: 'armed' }]]),
          triggers: JSON.stringify([]),
        },
      ]);

      await migration.up(queryInterface);

      // The houses are already rewritten by then: giving up here would leave the instance half
      // migrated on every boot, so the sound scene must still go through.
      const sceneUpdates = queryInterface.sequelize.query
        .getCalls()
        .filter((call) => call.args[0].startsWith('UPDATE t_scene'));

      expect(sceneUpdates).to.have.lengthOf(1);
      expect(sceneUpdates[0].args[1].replacements.id).to.equal('scene-ok');
    });

    it('should leave a scene with no actions and no triggers alone', async () => {
      const queryInterface = buildQueryInterface([{ id: 'scene-empty', actions: null, triggers: null }]);

      await migration.up(queryInterface);

      const sceneUpdates = queryInterface.sequelize.query
        .getCalls()
        .filter((call) => call.args[0].startsWith('UPDATE t_scene'));

      expect(sceneUpdates).to.have.lengthOf(0);
    });
  });

  it('should have an empty down migration', async () => {
    await migration.down();
  });
});
