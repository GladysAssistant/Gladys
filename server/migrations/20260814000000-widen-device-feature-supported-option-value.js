module.exports = {
  up: async (queryInterface) => {
    // Option values used to be integers only; dynamic selects (installed TV apps, HDMI
    // sources...) carry free-string identifiers, so the column becomes a string. Integer
    // values already stored keep working: the model restores them as numbers on read.
    //
    // The rebuild is done by hand: on SQLite, queryInterface.changeColumn recreates the
    // table from describeTable and mangles it — the composite unique index comes back as
    // per-column UNIQUE constraints and the foreign key loses its CASCADE clauses.
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `CREATE TABLE \`t_device_feature_supported_option_new\` (
          \`id\` UUID PRIMARY KEY,
          \`device_feature_id\` UUID NOT NULL REFERENCES \`t_device_feature\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
          \`value\` VARCHAR(255) NOT NULL,
          \`label\` VARCHAR(255) NOT NULL,
          \`sort_order\` INTEGER NOT NULL DEFAULT 0,
          \`created_at\` DATETIME NOT NULL,
          \`updated_at\` DATETIME NOT NULL
        );`,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `INSERT INTO \`t_device_feature_supported_option_new\`
          (\`id\`, \`device_feature_id\`, \`value\`, \`label\`, \`sort_order\`, \`created_at\`, \`updated_at\`)
        SELECT \`id\`, \`device_feature_id\`, CAST(\`value\` AS TEXT), \`label\`, \`sort_order\`, \`created_at\`, \`updated_at\`
        FROM \`t_device_feature_supported_option\`;`,
        { transaction },
      );
      await queryInterface.sequelize.query('DROP TABLE `t_device_feature_supported_option`;', { transaction });
      await queryInterface.sequelize.query(
        'ALTER TABLE `t_device_feature_supported_option_new` RENAME TO `t_device_feature_supported_option`;',
        { transaction },
      );
      await queryInterface.sequelize.query(
        `CREATE INDEX \`t_device_feature_supported_option_device_feature_id\`
          ON \`t_device_feature_supported_option\` (\`device_feature_id\`);`,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `CREATE UNIQUE INDEX \`t_device_feature_supported_option_device_feature_id_value\`
          ON \`t_device_feature_supported_option\` (\`device_feature_id\`, \`value\`);`,
        { transaction },
      );
    });
  },
  down: async () => {},
};
