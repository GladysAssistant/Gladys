module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Dynamic selects (installed TV apps, HDMI sources...) carry free-string identifiers.
    // Instead of widening the integer `value` column, string values get their own nullable
    // column, mirroring last_value / last_value_string on t_device_feature: existing rows
    // are left untouched and no table rebuild is needed.
    await queryInterface.addColumn('t_device_feature_supported_option', 'value_string', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // A string option has no meaningful integer value (the column keeps a filler), so the
    // composite unique index splits into two partial ones, each covering one value kind.
    // SQLite DDL is transactional: the swap runs in one transaction so a failure cannot
    // leave the table without its uniqueness guarantee.
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('t_device_feature_supported_option', ['device_feature_id', 'value'], {
        transaction,
      });
      await queryInterface.sequelize.query(
        `CREATE UNIQUE INDEX \`t_device_feature_supported_option_device_feature_id_value\`
          ON \`t_device_feature_supported_option\` (\`device_feature_id\`, \`value\`)
          WHERE \`value_string\` IS NULL;`,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `CREATE UNIQUE INDEX \`t_device_feature_supported_option_feature_id_value_string\`
          ON \`t_device_feature_supported_option\` (\`device_feature_id\`, \`value_string\`)
          WHERE \`value_string\` IS NOT NULL;`,
        { transaction },
      );
    });
  },
  // Purely additive: nothing destructive to undo, and an older Gladys simply ignores the
  // extra nullable column, so downgrading with the column in place is harmless.
  down: async () => {},
};
