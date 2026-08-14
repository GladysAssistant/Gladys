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
    await queryInterface.removeIndex('t_device_feature_supported_option', ['device_feature_id', 'value']);
    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX \`t_device_feature_supported_option_device_feature_id_value\`
        ON \`t_device_feature_supported_option\` (\`device_feature_id\`, \`value\`)
        WHERE \`value_string\` IS NULL;`,
    );
    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX \`t_device_feature_supported_option_feature_id_value_string\`
        ON \`t_device_feature_supported_option\` (\`device_feature_id\`, \`value_string\`)
        WHERE \`value_string\` IS NOT NULL;`,
    );
  },
  down: async () => {},
};
