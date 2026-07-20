const db = require('../../models');
const { WEBSOCKET_MESSAGE_TYPES, SERVICE_STATUS } = require('../../utils/constants');

// scheduled polls only make sense against a live integration: outside
// these statuses they become silent no-ops (see below)
const POLLABLE_STATUSES = [SERVICE_STATUS.RUNNING, SERVICE_STATUS.DEGRADED];

/**
 * @description Register the proxy service of an external integration in the
 * stateManager, under the name of its t_service row. This inserts external
 * integrations in the existing service lifecycle (service.startAll,
 * device.setValue, device.poll, device.notify) without touching the core
 * device nor the core service. setValue/poll send acked commands over
 * WebSocket; the postCreate/postUpdate/postDelete hooks (already called by
 * device.notify on every user gesture) relay the device lifecycle
 * notifications so the integration immediately knows which devices to follow
 * or drop, without polling.
 * @param {object} service - The external integration service (plain object).
 * @example
 * gladys.externalIntegration.registerProxyService(service);
 */
function registerProxyService(service) {
  // communication integrations expose the generic outbound channel
  // interface: message.send (reply path, by contact id) and
  // message.sendToUser (forwardToChannels loop — the proxy resolves the
  // linked contact itself and no-ops when the user is not linked)
  const isCommunication = service.manifest && service.manifest.type === 'communication';
  const messageCapability = isCommunication
    ? {
        message: Object.freeze({
          send: async (contactId, message) => {
            await this.sendCommand(service, WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.MESSAGE_SEND, {
              contact_id: contactId,
              message: { text: message.text, file: message.file || null },
            });
          },
          sendToUser: async (user, message) => {
            const contact = await this.getContactForUser(service, user.id);
            if (!contact) {
              return;
            }
            await this.sendCommand(service, WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.MESSAGE_SEND, {
              contact_id: contact.contact_id,
              message: { text: message.text, file: message.file || null },
            });
          },
        }),
      }
    : {};
  const proxyService = Object.freeze({
    start: async () => {
      await this.start(service.selector);
    },
    stop: async () => {
      await this.stop(service.selector);
    },
    ...messageCapability,
    device: Object.freeze({
      setValue: async (device, deviceFeature, value) => {
        await this.sendCommand(service, WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_SET_VALUE, {
          device: {
            external_id: device.external_id,
            selector: device.selector,
            params: device.params,
          },
          device_feature: {
            external_id: deviceFeature.external_id,
            category: deviceFeature.category,
            type: deviceFeature.type,
          },
          value,
        });
      },
      poll: async (device) => {
        // a poll scheduled while the integration is voluntarily stopped or
        // broken is a SILENT no-op: no throw, no log repeated every N
        // seconds for a state already known and displayed. setValue, on
        // the other hand, always throws: the user acting on a device must
        // see the error.
        const serviceInDb = await db.Service.findOne({ where: { id: service.id }, attributes: ['status'] });
        if (serviceInDb === null || !POLLABLE_STATUSES.includes(serviceInDb.status)) {
          return;
        }
        await this.sendCommand(service, WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_POLL, {
          device: {
            external_id: device.external_id,
            selector: device.selector,
            params: device.params,
          },
        });
      },
      postCreate: async (device) => {
        this.sendMessage(service, WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_CREATED, { device });
      },
      postUpdate: async (device) => {
        this.sendMessage(service, WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_UPDATED, { device });
      },
      postDelete: async (device) => {
        this.sendMessage(service, WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_DELETED, { device });
      },
    }),
  });
  this.stateManager.setState('service', service.name, proxyService);
  this.stateManager.setState('serviceById', service.id, proxyService);
}

module.exports = {
  registerProxyService,
};
