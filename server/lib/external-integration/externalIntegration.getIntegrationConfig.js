const db = require('../../models');

/**
 * @description Get the full config of an integration, secrets included
 * (this is for the integration itself, not for the frontend). Values are
 * stored JSON-encoded in t_variable, scoped by service_id. Config keys are
 * lowercase `[a-z0-9_]` while t_variable names must be uppercase, so keys
 * are uppercased at write time and lowercased back at read time.
 * @param {object} service - The external integration service.
 * @returns {Promise<object>} Resolve with the config object.
 * @example
 * const config = await gladys.externalIntegration.getIntegrationConfig(service);
 */
async function getIntegrationConfig(service) {
  const variables = await db.Variable.findAll({
    where: {
      service_id: service.id,
      user_id: null,
    },
  });
  const config = {};
  variables.forEach((variable) => {
    const key = variable.name.toLowerCase();
    try {
      config[key] = JSON.parse(variable.value);
    } catch (e) {
      // value set outside the config API: return it as a raw string
      config[key] = variable.value;
    }
  });
  return config;
}

module.exports = {
  getIntegrationConfig,
};
