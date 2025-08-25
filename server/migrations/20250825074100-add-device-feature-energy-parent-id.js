module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new feature energy_parent_id to device_feature table
    // This represents the hierarchy between devices at the energy level
    // For example, a washing machine can be under a power plug,
    // and it'll help us not count twice the energy consumption of the washing machine
    await queryInterface.addColumn('t_device_feature', 'energy_parent_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 't_device_feature',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addIndex('t_device_feature', ['energy_parent_id']);
  },
  down: async (queryInterface, Sequelize) => {},
};
