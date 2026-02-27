const db = require('../models');

module.exports = {
  up: async (queryInterface) => {
    // Get Tasmota service
    const service = await db.Service.findOne({
      attributes: ['id'],
      where: {
        name: 'tasmota',
      },
    });

    if (service == null) {
      return;
    }

    await queryInterface.sequelize.query(
      `
        UPDATE t_device_feature
        SET type = 'index-today'
        WHERE category = 'energy-sensor'
          AND type = 'energy'
          AND external_id LIKE '%:ENERGY:Today'
          AND device_id IN (
            SELECT id FROM t_device WHERE service_id = :serviceId
          )
      `,
      {
        replacements: {
          serviceId: service.id,
        },
      },
    );

    await queryInterface.sequelize.query(
      `
        UPDATE t_device_feature
        SET type = 'index-yesterday'
        WHERE category = 'energy-sensor'
          AND type = 'energy'
          AND external_id LIKE '%:ENERGY:Yesterday'
          AND device_id IN (
            SELECT id FROM t_device WHERE service_id = :serviceId
          )
      `,
      {
        replacements: {
          serviceId: service.id,
        },
      },
    );
  },
  down: async () => {},
};
