const db = require('../../models');
const { SERVICE_TYPES } = require('../../utils/constants');
const { getDeclaredSceneTriggers, getDeclaredSceneActions } = require('./externalIntegration.sceneDeclarations');

/**
 * @description The scene triggers and actions declared by the installed
 * integrations, for the scene editor: the integrations declaring at least
 * one of the two, in a reduced view (selector, display name, status and the
 * two declaration lists as stored) — no image, no containers, no webhooks,
 * so the payload is safe for every authenticated user, exactly like the
 * selectors already travelling in every scene.
 * @returns {Promise<Array>} Resolve with the list of integrations.
 * @example
 * const integrations = await gladys.externalIntegration.getSceneDeclarations();
 */
async function getSceneDeclarations() {
  const services = await db.Service.findAll({
    where: {
      type: SERVICE_TYPES.EXTERNAL,
      pod_id: null,
    },
    order: [['name', 'ASC']],
  });
  return services
    .map((service) => service.get({ plain: true }))
    .filter(
      (service) =>
        getDeclaredSceneTriggers(service.manifest).length > 0 || getDeclaredSceneActions(service.manifest).length > 0,
    )
    .map((service) => ({
      selector: service.selector,
      name: service.manifest.name,
      status: service.status,
      scene_triggers: getDeclaredSceneTriggers(service.manifest),
      scene_actions: getDeclaredSceneActions(service.manifest),
    }));
}

module.exports = {
  getSceneDeclarations,
};
