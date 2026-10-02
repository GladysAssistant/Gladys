// Room names used to be unique across the whole instance: a user with two houses
// could not have a "Living room" in each. The name is now unique per house only,
// the selector stays unique instance-wide (it is the room identifier in URLs,
// scenes and dashboards).
//
// SQLite cannot drop a column-level UNIQUE constraint (its implicit
// sqlite_autoindex cannot be removed), so the table is rebuilt following the
// documented procedure (https://www.sqlite.org/lang_altertable.html#otheralter):
// create the new table, copy, drop the old one, rename.
//
// Foreign keys MUST be off during the rebuild: t_device.room_id and
// t_pod.room_id reference t_room with ON DELETE CASCADE, and with foreign keys
// on, the DROP TABLE runs an implicit DELETE that would cascade to every device.
// The pragma is a no-op inside a transaction, so it is switched on the default
// connection (Sequelize gives each transaction its own SQLite connection, with
// foreign keys on) and the rebuild runs in a BEGIN/COMMIT on that same connection.

const CREATE_ROOM_TABLE = `CREATE TABLE \`t_room_new\` (
  \`id\` UUID NOT NULL PRIMARY KEY,
  \`house_id\` UUID NOT NULL REFERENCES \`t_house\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
  \`name\` VARCHAR(255) NOT NULL,
  \`selector\` VARCHAR(255) NOT NULL UNIQUE,
  \`created_at\` DATETIME NOT NULL,
  \`updated_at\` DATETIME NOT NULL
);`;

const ROOM_COLUMNS = '`id`, `house_id`, `name`, `selector`, `created_at`, `updated_at`';

const { QueryTypes } = require('sequelize');

const CREATE_HOUSE_ID_NAME_INDEX =
  'CREATE UNIQUE INDEX IF NOT EXISTS `t_room_house_id_name` ON `t_room` (`house_id`, `name`);';

/**
 * @description Tell whether t_room still carries a unique index on the name alone.
 * @param {object} sequelize - The sequelize instance.
 * @returns {Promise<boolean>} True when the instance-wide unique name is still there.
 * @example
 * await hasInstanceWideUniqueName(sequelize);
 */
async function hasInstanceWideUniqueName(sequelize) {
  const indexes = await sequelize.query('PRAGMA index_list(`t_room`);', { type: QueryTypes.SELECT });
  const uniqueIndexes = indexes.filter((index) => index.unique === 1);
  const columnsByIndex = await Promise.all(
    uniqueIndexes.map(async (index) => {
      const columns = await sequelize.query(`PRAGMA index_info(\`${index.name}\`);`, { type: QueryTypes.SELECT });
      return columns.map((column) => column.name);
    }),
  );
  return columnsByIndex.some((columns) => columns.length === 1 && columns[0] === 'name');
}

/**
 * @description Count the foreign keys pointing to a missing room.
 * @param {object} sequelize - The sequelize instance.
 * @returns {Promise<number>} The number of rows referencing a room that does not exist.
 * @example
 * await countBrokenRoomReferences(sequelize);
 */
async function countBrokenRoomReferences(sequelize) {
  const violations = await sequelize.query('PRAGMA foreign_key_check;', { type: QueryTypes.SELECT });
  return violations.filter((violation) => violation.parent === 't_room').length;
}

module.exports = {
  up: async (queryInterface) => {
    const { sequelize } = queryInterface;

    if (!(await hasInstanceWideUniqueName(sequelize))) {
      // Already migrated (or created by a newer schema): only make sure the
      // per-house uniqueness is there.
      await sequelize.query(CREATE_HOUSE_ID_NAME_INDEX);
      return;
    }

    await sequelize.query('PRAGMA foreign_keys = OFF;');
    try {
      const [{ foreign_keys: foreignKeysEnabled }] = await sequelize.query('PRAGMA foreign_keys;', {
        type: QueryTypes.SELECT,
      });
      // Never drop t_room with foreign keys on: it would delete every device.
      if (foreignKeysEnabled) {
        throw new Error('Unable to disable foreign keys, t_room cannot be rebuilt safely');
      }
      // Orphans left by an old bug must not block the upgrade: only the ones the
      // rebuild itself would create are an error.
      const brokenReferencesBefore = await countBrokenRoomReferences(sequelize);
      await sequelize.query('BEGIN TRANSACTION;');
      try {
        await sequelize.query('DROP TABLE IF EXISTS `t_room_new`;');
        await sequelize.query(CREATE_ROOM_TABLE);
        await sequelize.query(`INSERT INTO \`t_room_new\` (${ROOM_COLUMNS}) SELECT ${ROOM_COLUMNS} FROM \`t_room\`;`);
        await sequelize.query('DROP TABLE `t_room`;');
        await sequelize.query('ALTER TABLE `t_room_new` RENAME TO `t_room`;');
        await sequelize.query('CREATE INDEX `t_room_house_id` ON `t_room` (`house_id`);');
        await sequelize.query(CREATE_HOUSE_ID_NAME_INDEX);
        const brokenReferencesAfter = await countBrokenRoomReferences(sequelize);
        if (brokenReferencesAfter > brokenReferencesBefore) {
          throw new Error(`t_room rebuild broke ${brokenReferencesAfter - brokenReferencesBefore} room reference(s)`);
        }
        await sequelize.query('COMMIT;');
      } catch (e) {
        await sequelize.query('ROLLBACK;');
        throw e;
      }
    } finally {
      await sequelize.query('PRAGMA foreign_keys = ON;');
    }
  },
  // Restoring an instance-wide unique name would fail as soon as two houses
  // share a room name; an older Gladys works fine with the per-house index.
  down: async () => {},
};
