const Promise = require('bluebird');
const logger = require('../../utils/logger');
const db = require('../../models');
const { SERVICE_TYPES } = require('../../utils/constants');

/**
 * @public
 * @description List every messaging channel able to send a message to a user:
 * the core services exposing `message.sendToUser` (telegram, nextcloud-talk,
 * callmebot…) and the external integrations of type "communication" (the Free
 * Mobile SMS family). This feeds the channel selector of the "send message"
 * scene action, so only channels the user can actually use are returned:
 * - a service flagged in database but not currently loaded in the
 *   stateManager is filtered out: it could not deliver anything;
 * - a core service loaded but not configured is filtered out too. A service
 *   that failed to start with a ServiceNotConfiguredError stays RUNNING and
 *   keeps its `message.sendToUser` method, so the presence of the method is
 *   not a proof of configuration: the `isUsed()` hook is, like in getUsage().
 *   A core messaging service without that hook is kept, as there is nothing
 *   to check it against.
 *
 * An installed external integration is always configured by definition (the
 * user installed it), and it is proxied, so it exposes no `isUsed()` hook.
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

  const services = await Promise.mapSeries(servicesInDb, async (serviceInDb) => {
    const plainService = serviceInDb.get({ plain: true });
    const loadedService = this.getService(plainService.name);
    const canSendToUser = Boolean(
      loadedService && loadedService.message && typeof loadedService.message.sendToUser === 'function',
    );
    if (!canSendToUser) {
      return null;
    }
    if (plainService.type !== SERVICE_TYPES.EXTERNAL && typeof loadedService.isUsed === 'function') {
      try {
        const isUsed = await loadedService.isUsed();
        if (!isUsed) {
          return null;
        }
      } catch (e) {
        logger.warn(`Unable to know if messaging service ${plainService.name} is used`, e);
        return null;
      }
    }
    return {
      id: plainService.id,
      name: plainService.name,
      selector: plainService.selector,
      status: plainService.status,
      // internal / external: a core service and an external integration can
      // carry the very same name (a native Telegram and a Telegram
      // integration from the store), so the front needs to tell them apart
      type: plainService.type,
      // an external integration carries its human readable name in its
      // manifest. A core service has none: the front translates its
      // technical name through the integration.* i18n dictionary, so send
      // the manifest name on its own and let the front fall back to `name`.
      manifest_name: (plainService.manifest && plainService.manifest.name) || null,
    };
  });

  return services.filter((service) => service !== null);
}

module.exports = {
  getMessageServices,
};
