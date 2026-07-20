const db = require('../../models');
const { ExternalIntegrationUnavailableError } = require('../../utils/coreErrors');
const { WEBSOCKET_MESSAGE_TYPES, SERVICE_STATUS } = require('../../utils/constants');
const { CAMERA_GET_IMAGE_TIMEOUT_MS } = require('./constants');

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
      getImage: async (device) => {
        // camera.getLiveImage path (dashboard live view, "show me the
        // camera" chat intent): ask the integration for a FRESH image.
        // An ffmpeg capture can be slow: 15s ack deadline, not 5s.
        const result = await this.sendCommand(
          service,
          WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.CAMERA_GET_IMAGE,
          {
            device: {
              external_id: device.external_id,
              selector: device.selector,
              params: device.params,
            },
          },
          { timeoutMs: CAMERA_GET_IMAGE_TIMEOUT_MS },
        );
        const image = result && result.data && result.data.image;
        if (typeof image !== 'string' || image.length === 0) {
          throw new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_INVALID_CAMERA_IMAGE');
        }
        return image;
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
