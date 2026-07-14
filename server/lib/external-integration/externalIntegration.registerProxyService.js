const { WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

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
  const proxyService = Object.freeze({
    start: async () => {
      await this.start(service.selector);
    },
    stop: async () => {
      await this.stop(service.selector);
    },
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
