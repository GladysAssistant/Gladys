const db = require('../../models');
const { RESERVED_PARAM_PREFIX, PREFER_LOCAL_CONFIG_KEY, MANIFEST_TRANSPORTS } = require('./constants');

/**
 * @description True when the manifest declares both the local and cloud
 * transports: Gladys then renders the standard "prefer local" toggle.
 * @param {object} manifest - The integration manifest.
 * @returns {boolean} True when both transports are declared.
 * @example
 * const dual = hasDualTransports(service.manifest);
 */
function hasDualTransports(manifest) {
  const transports = (manifest && manifest.transports) || [];
  return MANIFEST_TRANSPORTS.every((transport) => transports.includes(transport));
}

/**
 * @description Get the full config of an integration, secrets included
 * (this is for the integration itself, not for the frontend). Values are
 * stored JSON-encoded in t_variable, scoped by service_id. Config keys are
 * lowercase `[a-z0-9_]` while t_variable names must be uppercase, so keys
 * are uppercased at write time and lowercased back at read time — except
 * the reserved GLADYS_* keys (user preferences like GLADYS_PREFER_LOCAL),
 * kept as-is: they cannot collide with integration keys, which can never
 * be uppercase.
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
    const key = variable.name.startsWith(RESERVED_PARAM_PREFIX) ? variable.name : variable.name.toLowerCase();
    try {
      config[key] = JSON.parse(variable.value);
    } catch (e) {
      // value set outside the config API: return it as a raw string
      config[key] = variable.value;
    }
  });
  if (hasDualTransports(service.manifest) && config[PREFER_LOCAL_CONFIG_KEY] === undefined) {
    // the standard preference defaults to true until the user touches it
    config[PREFER_LOCAL_CONFIG_KEY] = true;
  }
  return config;
}

module.exports = {
  getIntegrationConfig,
  hasDualTransports,
};
