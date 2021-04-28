const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

/**
 * @description New value camera received.
 * @param {Object} data - Data received.
 * @example
 * newValueCamera(122324, {
 * });
 */
function newValueCamera(data) {
  const sid = data.id;

  // we create the camera device
  if (data.type === 'NOC' || data.type === 'NACamera') {
    let newCamera;
    logger.debug(`Netatmo : New camera, sid = ${sid} - ${data.type}`);
    if (data.type === 'NOC') {
      newCamera = {
        name: data.name,
        should_poll: false,
        external_id: `netatmo:${sid}`,
        selector: `netatmo:${sid}`,
        service_id: this.serviceId,
        model: `netatmo-${data.type}`,
        cameraUrl: {
          name: `CAMERA_URL - ${data.name}`,
          value: `${data.vpn_url}/live/snapshot_720.jpg`,
        },
        features: [
          {
            name: data.name,
            selector: `netatmo:${sid}:camera`,
            external_id: `netatmo:${sid}:camera`,
            category: DEVICE_FEATURE_CATEGORIES.CAMERA,
            type: DEVICE_FEATURE_TYPES.CAMERA.IMAGE,
            read_only: false,
            keep_history: false,
            has_feedback: false,
            min: 0,
            max: 0,
          },
          {
            name: `Light - ${data.name}`,
            selector: `netatmo:${sid}:light`,
            external_id: `netatmo:${sid}:light`,
            category: DEVICE_FEATURE_CATEGORIES.LIGHT,
            type: DEVICE_FEATURE_TYPES.LIGHT.STRING,
            read_only: false,
            keep_history: true,
            has_feedback: true,
            min: 0,
            max: 2,
          },
          {
            name: `Siren - ${data.name}`,
            selector: `netatmo:${sid}:siren`,
            external_id: `netatmo:${sid}:siren`,
            category: DEVICE_FEATURE_CATEGORIES.SIREN,
            type: DEVICE_FEATURE_TYPES.SIREN.BINARY,
            read_only: false,
            keep_history: true,
            has_feedback: true,
            min: 0,
            max: 1,
          },
          {
            name: `Power - ${data.name}`,
            selector: `netatmo:${sid}:power`,
            external_id: `netatmo:${sid}:power`,
            category: DEVICE_FEATURE_CATEGORIES.SWITCH,
            type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
            read_only: true,
            keep_history: true,
            has_feedback: true,
            min: 0,
            max: 1,
          },
        ],
        params: [
          {
            name: `CAMERA_URL - ${data.name}`,
            value: `${data.vpn_url}/live/snapshot_720.jpg`,
          },
        ],
      };
    }
    if (data.type === 'NACamera') {
      newCamera = {
        name: data.name,
        should_poll: false,
        external_id: `netatmo:${sid}`,
        selector: `netatmo:${sid}`,
        service_id: this.serviceId,
        model: `netatmo-${data.type}`,
        cameraUrl: {
          name: `CAMERA_URL - ${data.name}`,
          value: `${data.vpn_url}/live/snapshot_720.jpg`,
        },
        features: [
          {
            name: data.name,
            selector: `netatmo:${sid}:camera`,
            external_id: `netatmo:${sid}:camera`,
            category: DEVICE_FEATURE_CATEGORIES.CAMERA,
            type: DEVICE_FEATURE_TYPES.CAMERA.IMAGE,
            read_only: false,
            keep_history: false,
            has_feedback: false,
            min: 0,
            max: 0,
          },
          {
            name: `Power - ${data.name}`,
            selector: `netatmo:${sid}:power`,
            external_id: `netatmo:${sid}:power`,
            category: DEVICE_FEATURE_CATEGORIES.SWITCH,
            type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
            read_only: true,
            keep_history: true,
            has_feedback: true,
            min: 0,
            max: 1,
          },
        ],
        params: [
          {
            name: `CAMERA_URL - ${data.name}`,
            value: `${data.vpn_url}/live/snapshot_720.jpg`,
          },
        ],
      };
      if (data.modules !== undefined) {
        data.modules.forEach((module) => {
          if (module.type === 'NIS' || module.type === 'NACamDoorTag') {
            // if the "NACamera" camera module is present
            const sidModule = module.id;
            const moduleName = module.name;
            logger.debug(`Netatmo : New Module Camera, sid = ${sidModule} - ${module.type}`);
            let newModuleCam;
            if (module.type === 'NIS') {
              // if siren module present, the device is created
              newModuleCam = {
                service_id: this.serviceId,
                name: `Siren - ${moduleName}`,
                selector: `netatmo:${sidModule}`,
                external_id: `netatmo:${sidModule}`,
                model: `netatmo-${module.type}`,
                should_poll: false,
                features: [
                  {
                    name: `Battery - ${moduleName}`,
                    selector: `netatmo:${sidModule}:battery`,
                    external_id: `netatmo:${sidModule}:battery`,
                    category: DEVICE_FEATURE_CATEGORIES.BATTERY,
                    type: DEVICE_FEATURE_TYPES.BATTERY.INTEGER,
                    unit: DEVICE_FEATURE_UNITS.PERCENT,
                    read_only: true,
                    keep_history: true,
                    has_feedback: true,
                    min: 0,
                    max: 100,
                  },
                  {
                    name: `Détection intrusion - ${moduleName}`,
                    selector: `netatmo:${sidModule}:siren`,
                    external_id: `netatmo:${sidModule}:siren`,
                    category: DEVICE_FEATURE_CATEGORIES.SIREN,
                    type: DEVICE_FEATURE_TYPES.SIREN.BINARY,
                    read_only: false,
                    keep_history: true,
                    has_feedback: true,
                    min: 0,
                    max: 1,
                  },
                ],
              };
            }
            if (module.type === 'NACamDoorTag') {
              // if the Door and window opening detector module is present, the device is created
              newModuleCam = {
                service_id: this.serviceId,
                name: moduleName,
                selector: `netatmo:${sidModule}`,
                external_id: `netatmo:${sidModule}`,
                model: `netatmo-${module.type}`,
                should_poll: false,
                features: [
                  {
                    name: `Battery - ${moduleName}`,
                    selector: `netatmo:${sidModule}:battery`,
                    external_id: `netatmo:${sidModule}:battery`,
                    category: DEVICE_FEATURE_CATEGORIES.BATTERY,
                    type: DEVICE_FEATURE_TYPES.BATTERY.INTEGER,
                    unit: DEVICE_FEATURE_UNITS.PERCENT,
                    read_only: true,
                    keep_history: true,
                    has_feedback: true,
                    min: 0,
                    max: 100,
                  },
                  {
                    name: `Détection intrusion - ${moduleName}`,
                    selector: `netatmo:${sidModule}:doorTag`,
                    external_id: `netatmo:${sidModule}:doorTag`,
                    category: DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR,
                    type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
                    read_only: true,
                    keep_history: true,
                    has_feedback: true,
                    min: 0,
                    max: 1,
                  },
                ],
              };
            }
            this.addSensor(sidModule, newModuleCam);
          } else {
            logger.info(`Files newValueStation - Module type unknown : ${module.type}`);
            this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
              type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERRORDATA,
              payload: `Files newValueStation - Module type unknown : ${module.type}`,
            });
          }
        });
      }
    }
    this.addSensor(sid, newCamera);
  } else {
    logger.info(`Files newValueCamera - Device type unknown : ${data.type}`);
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERRORDATA,
      payload: `Files newValueCamera - Device type unknown : ${data.type}`,
    });
  }
}

module.exports = {
  newValueCamera,
};
