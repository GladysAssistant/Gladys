// The label of a supported option in every language an integration published
// ({ en, fr?, de?, es? }): `label` keeps its English text for every consumer
// that knows nothing of translations, and the frontend shows the user's
// language from this column. Null for a plain string label.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_device_feature_supported_option', 'label_translations', {
      type: Sequelize.JSON,
      allowNull: true,
    });
  },
  // A native DROP COLUMN (SQLite >= 3.35): Sequelize's removeColumn rebuilds the
  // table on SQLite and would lose the partial unique indexes of the value columns.
  down: async (queryInterface) => {
    await queryInterface.sequelize.query(
      'ALTER TABLE `t_device_feature_supported_option` DROP COLUMN `label_translations`;',
    );
  },
};
