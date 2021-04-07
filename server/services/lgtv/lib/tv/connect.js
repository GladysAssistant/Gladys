const { promisify } = require('util');
const LGTV = require('lgtv2');
const { getDeviceID, timeout } = require('./utils');
const { STATE } = require('./consts');
const logger = require('../../../../utils/logger');
const { DEVICE_FEATURE_TYPES, EVENTS, DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');
const { getDeviceParam, getDeviceFeature } = require('../../../../utils/device');

const TIMEOUT = 10000; // ms

const connect = async function connect(device) {
  logger.info(`LGTV ${device.id} connecting...`);
  if (this.connections.has(device.id)) {
    const existing = this.connections.get(device.id);

    if (existing.status === STATE.CONNECTED) {
      logger.info(`LGTV ${device.id} already connected`);
      return;
    }

    if (![STATE.PROMPT, STATE.RECONNECT, STATE.TIMEOUT].includes(existing.state)) {
      logger.warn(`LGTV connection failed. Entity in unexpected state ${existing.state}`);
      return;
    }
  }
  const address = device.params.find((param) => param.name === 'address').value;
  const connection = {
    handler: LGTV({
      url: `ws://${address}:3000`,
      timeout: 5000,
      reconnect: 10000,
    }),
    state: STATE.CONNECTING,
  };

  connection.handler.on('connect', () => {
    logger.info(`LGTV ${device.id} connected`);
    connection.state = STATE.CONNECTED;

    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `${device.id}:${DEVICE_FEATURE_TYPES.MEDIA_PLAYER.POWER}`,
      state: 1,
    });

    connection.handler.subscribe('ssap://audio/getVolume', (err, res) => {
      if (res.changed.indexOf('volume') !== -1) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `${device.id}:${DEVICE_FEATURE_TYPES.MEDIA_PLAYER.VOLUME}`,
          state: res.volume,
        });
      }

      if (res.changed.indexOf('muted') !== -1) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `${device.id}:${DEVICE_FEATURE_TYPES.MEDIA_PLAYER.MUTED}`,
          state: res.muted,
        });
      }
    });

    connection.handler.subscribe('ssap://com.webos.applicationManager/getForegroundAppInfo', (err, res) => {
      const sourceList = getDeviceParam(device, 'source_list');

      const source = {
        id: res.appId,
        label: null,
        image: null,
      };

      if (sourceList) {
        const correspondingSourceListItem = JSON.parse(sourceList).find((sl) => sl.id === source.id);

        if (correspondingSourceListItem) {
          source.label = correspondingSourceListItem.label;
          source.image = correspondingSourceListItem.image;
        }
      }

      (async () => {
        await this.gladys.device.saveStringState(
          device,
          getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.MEDIA_PLAYER, DEVICE_FEATURE_TYPES.MEDIA_PLAYER.SOURCE),
          JSON.stringify(source),
        );
      })();
    });

    connection.handler.subscribe('ssap://tv/getExternalInputList', (err, res) => {
      this.gladys.event.emit(EVENTS.DEVICE.ADD_PARAM, device.selector, {
        name: `source_list`,
        value: JSON.stringify(
          res.devices.map((d) => ({
            id: d.appId,
            label: d.label,
            image: d.icon,
            connected: d.connected,
          })),
        ),
      });

      const source = getDeviceParam(device, 'source');

      if (!source) {
        return;
      }

      const sourceValue = JSON.parse(source);
      const currentSource = res.devices.find((d) => d.appId === sourceValue.id) || {};

      (async () => {
        await this.gladys.device.saveStringState(
          device,
          getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.MEDIA_PLAYER, DEVICE_FEATURE_TYPES.MEDIA_PLAYER.SOURCE),
          JSON.stringify({
            ...sourceValue,
            label: currentSource.label || null,
            image: currentSource.icon || null,
          }),
        );
      })();
    });
  });

  connection.handler.on('prompt', () => {
    logger.info(`LGTV ${device.id} prompt`);
    connection.state = STATE.PROMPT;
  });

  connection.handler.on('error', (e) => {
    logger.info(`LGTV ${device.id} error`, e);

    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `${device.id}:${DEVICE_FEATURE_TYPES.MEDIA_PLAYER.POWER}`,
      state: 0,
    });

    if (e.code === 'ETIMEDOUT') {
      connection.state = STATE.TIMEOUT;
    } else {
      connection.state = STATE.ERROR;
    }
  });

  connection.handler.on('close', () => {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `${device.id}:${DEVICE_FEATURE_TYPES.MEDIA_PLAYER.POWER}`,
      state: 0,
    });
  });

  this.connections.set(device.id, connection);
};

module.exports = connect;
