const logger = require('../../../../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_UNITS } = require('../../../../utils/constants');

const { DEVICE_POLL_FREQUENCIES } = require('../../../../utils/constants');

/**
 * @description New value camera received.
 * @param {Object} data - Data received.
 * @example
 * newValueCamera(122324, {
 * });
 */
function newValueCamera(data) {
  const sid = data.id;
  let newCamera;
  logger.debug(`Netatmo : New camera, sid = ${sid}`);
  this.devices[sid] = data;
  // on crée le device caméra
  if(data.type === 'NACamera'){
    newCamera = {
      name: data.name,
      should_poll: true,
      poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
      external_id: `netatmo:${sid}`,
      selector: `netatmo:${sid}`,
      service_id: this.serviceId,
      model: `netatmo-${data.type}`,
      cameraUrl: {
        name: 'CAMERA_URL',
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
          name: 'Power',
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
          name: 'CAMERA_URL',
          value: `${data.vpn_url}/live/snapshot_720.jpg`,
        },
      ],
    };
    this.devices[sid].modules.forEach((module) => {
      // si module de la camera "NACamera" présent
      const sidModule = module.id;
      const moduleName = module.name;
      logger.debug(`Netatmo : New Module Camera, sid = ${sidModule}`);
      this.devices[sidModule] = module;
      let newModuleCam;
      if(module.type === 'NIS'){
        // si module sirène présent on crée le device
        newModuleCam = {
          service_id: this.serviceId,
          name: `Siren - ${moduleName}`,
          selector: `netatmo:${sidModule}`,
          external_id: `netatmo:${sidModule}`,
          model: `netatmo-sirene-${module.type}`,
          should_poll: false,
          // poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
          features: [
            {
              name: `Battery - ${moduleName}`,
              selector: `netatmo:${sidModule}:battery`,
              external_id: `netatmo:${sidModule}:battery`,
              category: DEVICE_FEATURE_CATEGORIES.BATTERY,
              type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
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
      if(module.type === 'NACamDoorTag'){
        // si module Détecteur d'ouverture porte et fenêtre présent on crée le device
        newModuleCam = {
          service_id: this.serviceId,
          name: moduleName,
          selector: `netatmo:${sidModule}`,
          external_id: `netatmo:${sidModule}`,
          model: `netatmo-${module.type}`,
          should_poll: false,
          // poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
          features: [
            {
              name: `Battery - ${moduleName}`,
              selector: `netatmo:${sidModule}:battery`,
              external_id: `netatmo:${sidModule}:battery`,
              category: DEVICE_FEATURE_CATEGORIES.BATTERY,
              type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
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
    });
  }
  if(data.type === 'NOC'){      
    newCamera = {
      name: data.name,
      should_poll: true,
      poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
      external_id: `netatmo:${sid}`,
      selector: `netatmo:${sid}`,
      service_id: this.serviceId,
      model: `netatmo-${data.type}`,
      cameraUrl: {
        name: 'CAMERA_URL',
        value: `${data.homeStatus.vpn_url}/live/snapshot_720.jpg`,
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
          max: 0
        },
        {
          name: 'Light',
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
          name: 'Siren',
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
          name: 'Power',
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
          name: 'CAMERA_URL',
          value: `${data.homeStatus.vpn_url}/live/snapshot_720.jpg`,
        }
      ]
    };
  }
  this.addSensor(sid, newCamera);
}

module.exports = {
  newValueCamera,
};
