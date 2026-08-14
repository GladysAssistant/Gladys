const db = require('../../models');

/**
 * @public
 * @description List every messaging channel able to send a message to a user:
 * the core services exposing `message.sendToUser` (telegram, nextcloud-talk,
 * callmebot…) and the external integrations of type "communication" (the Free
 * Mobile SMS family). This feeds the channel selector of the "send message"
 * scene action, so a service flagged in database but not currently loaded in
 * the stateManager is filtered out: it could not deliver anything.
 * @returns {Promise} Resolve with the list of messaging services.
 * @example
 * const channels = await service.getMessageServices();
 */
async function getMessageServices() {
  const servicesInDb = await db.Service.findAll({
    where: {
      has_message_feature: true,
    },
    include: [
      {
        model: db.Pod,
        as: 'pod',
      },
    ],
  });
  return servicesInDb
    .map((serviceInDb) => {
      const plainService = serviceInDb.get({ plain: true });
      const loadedService = this.getService(plainService.name);
      const canSendToUser = Boolean(
        loadedService && loadedService.message && typeof loadedService.message.sendToUser === 'function',
      );
      return { plainService, canSendToUser };
    })
    .filter(({ canSendToUser }) => canSendToUser)
    .map(({ plainService }) => ({
      id: plainService.id,
      name: plainService.name,
      selector: plainService.selector,
      status: plainService.status,
      // an external integration carries its human readable name in its
      // manifest. A core service has none: the front translates its
      // technical name through the integration.* i18n dictionary, so send
      // the manifest name on its own and let the front fall back to `name`.
      manifest_name: (plainService.manifest && plainService.manifest.name) || null,
    }));
}

module.exports = {
  getMessageServices,
};
