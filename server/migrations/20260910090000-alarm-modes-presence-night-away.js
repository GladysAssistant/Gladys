const { ACTIONS, ALARM_MODES, EVENTS } = require('../utils/constants');

// Old alarm mode value -> new one. `panic` is no longer an arming mode: what it described is the
// alarm going off, which is now its own state.
const MODE_RENAMES = {
  'partially-armed': ALARM_MODES.PRESENCE_ARMED,
  armed: ALARM_MODES.AWAY_ARMED,
  panic: ALARM_MODES.TRIGGERED,
};

// Old scene trigger type -> new one.
const TRIGGER_RENAMES = {
  'alarm.partial-arm': EVENTS.ALARM.PRESENCE_ARM,
  'alarm.arm': EVENTS.ALARM.AWAY_ARM,
};

/**
 * @description Rewrite one scene action, and every action nested in its if/then/else blocks.
 * @param {object} action - Scene action to migrate.
 * @returns {object} The migrated action.
 * @example migrateAction({ type: 'alarm.set-alarm-mode', alarm_mode: 'armed' });
 */
function migrateAction(action) {
  if (!action || typeof action !== 'object') {
    return action;
  }

  let migrated = action;

  if (action.type === ACTIONS.ALARM.SET_ALARM_MODE && action.alarm_mode === 'panic') {
    // Setting the alarm to "panic" was the only way to set it off: it is an action of its own now,
    // and it carries no mode.
    const { alarm_mode: alarmMode, ...rest } = action;
    migrated = { ...rest, type: ACTIONS.ALARM.TRIGGER_PANIC };
  } else if (
    (action.type === ACTIONS.ALARM.SET_ALARM_MODE || action.type === ACTIONS.ALARM.CHECK_ALARM_MODE) &&
    MODE_RENAMES[action.alarm_mode]
  ) {
    migrated = { ...action, alarm_mode: MODE_RENAMES[action.alarm_mode] };
  }

  ['if', 'then', 'else'].forEach((key) => {
    if (!Array.isArray(migrated[key])) {
      return;
    }
    // `if` holds a flat list of actions, `then` and `else` hold a list of parallel groups.
    const nested =
      key === 'if'
        ? migrated[key].map(migrateAction)
        : migrated[key].map((group) => (Array.isArray(group) ? group.map(migrateAction) : group));
    migrated = { ...migrated, [key]: nested };
  });

  return migrated;
}

/**
 * @description Rewrite one scene trigger.
 * @param {object} trigger - Scene trigger to migrate.
 * @returns {object} The migrated trigger.
 * @example migrateTrigger({ type: 'alarm.partial-arm', house: 'main-house' });
 */
function migrateTrigger(trigger) {
  if (!trigger || typeof trigger !== 'object' || !TRIGGER_RENAMES[trigger.type]) {
    return trigger;
  }
  return { ...trigger, type: TRIGGER_RENAMES[trigger.type] };
}

module.exports = {
  up: async (queryInterface) => {
    // t_house.alarm_mode is a plain TEXT column (Sequelize maps ENUM to TEXT on SQLite), so the
    // values are simply rewritten in place.
    await Promise.all(
      Object.keys(MODE_RENAMES).map((oldMode) =>
        queryInterface.sequelize.query('UPDATE t_house SET alarm_mode = :newMode WHERE alarm_mode = :oldMode', {
          replacements: { newMode: MODE_RENAMES[oldMode], oldMode },
        }),
      ),
    );

    const [scenes] = await queryInterface.sequelize.query('SELECT id, actions, triggers FROM t_scene');

    await Promise.all(
      scenes.map(async (scene) => {
        const actions = typeof scene.actions === 'string' ? JSON.parse(scene.actions) : scene.actions;
        const triggers = typeof scene.triggers === 'string' ? JSON.parse(scene.triggers) : scene.triggers;

        const newActions = Array.isArray(actions)
          ? actions.map((group) => (Array.isArray(group) ? group.map(migrateAction) : group))
          : actions;
        const newTriggers = Array.isArray(triggers) ? triggers.map(migrateTrigger) : triggers;

        const actionsJson = JSON.stringify(newActions);
        const triggersJson = JSON.stringify(newTriggers);

        // Nothing to do for the scenes that never mentioned the alarm.
        if (actionsJson === JSON.stringify(actions) && triggersJson === JSON.stringify(triggers)) {
          return;
        }

        // Written in raw SQL rather than through the model: the Joi validator of t_scene would
        // reject any unrelated legacy content still sitting in another scene field.
        await queryInterface.sequelize.query(
          'UPDATE t_scene SET actions = :actions, triggers = :triggers WHERE id = :id',
          { replacements: { actions: actionsJson, triggers: triggersJson, id: scene.id } },
        );
      }),
    );
  },
  down: async () => {},
  migrateAction,
  migrateTrigger,
};
