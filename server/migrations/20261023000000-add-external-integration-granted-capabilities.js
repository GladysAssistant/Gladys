module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('t_service', 'granted_capabilities', {
      type: Sequelize.JSON,
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    // native DROP COLUMN (SQLite >= 3.35), not queryInterface.removeColumn:
    // on SQLite, Sequelize emulates removeColumn by recreating the table,
    // which would cascade on the rows referencing t_service (the lint rule
    // no-call/no-call forbids it for that reason)
    await queryInterface.sequelize.query('ALTER TABLE t_service DROP COLUMN granted_capabilities');
  },
};
