const axios = require('axios');
const sharp = require('sharp');
const btoa = require('btoa');
const logger = require('../../../../utils/logger');
const { NETATMO_VALUES } = require('../constants');

/**
 * @description Poll value of a Netatmo devices
 * @param {string} key - Data received.
 * @param {Object} device - Data received.
 * @param {string} deviceSelector - Data received.
 * @example
 * updateCamera();
 */
async function updateCamera(key, device, deviceSelector) {
  // we process the data from the cameras

  try {
    if (device !== undefined) {
      try {
        const externalIdCamera = `netatmo:${this.devices[key].id}`;
        const selectorCamera = externalIdCamera.replace(/:/gi, '-');
        // @ts-ignore
        const responseImage = await axios.get(`${this.devices[key].vpn_url}/live/snapshot_720.jpg`, {
          responseType: 'arraybuffer',
        });
        const sharpData = await sharp(responseImage.data)
          .rotate()
          .resize(300)
          .toBuffer();
        const b64encoded = btoa(
          [].reduce.call(
            new Uint8Array(sharpData),
            // eslint-disable-next-line func-names
            function(p, c) {
              return p + String.fromCharCode(c);
            },
            '',
          ),
        );
        const mimetype = 'image/jpeg';
        const base64image = `data:${mimetype};base64,${b64encoded}`;
        this.gladys.device.camera.setImage(selectorCamera, base64image);
      } catch (e) {
        logger.error(
          `Netatmo : File netatmo.updateCamera.js - Camera ${this.devices[key].type} ${this.devices[key].name} - vpn_url - error : ${e}`,
        );
      }
      try {
        const powerValue = NETATMO_VALUES.SECURITY.LIGHT[this.devices[key].alim_status.toUpperCase()];
        await this.updateFeature(key, device, deviceSelector, 'power', powerValue);
      } catch (e) {
        logger.error(
          `Netatmo : File netatmo.updateCamera.js - Camera ${this.devices[key].type} ${this.devices[key].name} - power - error : ${e}`,
        );
      }
      try {
        if (this.devices[key].type === 'NOC') {
          const lightValue = NETATMO_VALUES.SECURITY.LIGHT[this.devices[key].light_mode_status.toUpperCase()];
          const sirenValue = NETATMO_VALUES.SECURITY.SIREN[this.devices[key].siren_status.toUpperCase()];
          try {
            await this.updateFeature(key, device, deviceSelector, 'light', lightValue);
          } catch (e) {
            logger.error(
              `Netatmo : File netatmo.updateCamera.js - Camera NOC ${this.devices[key].name} - light - error : ${e}`,
            );
          }
          try {
            await this.updateFeature(key, device, deviceSelector, 'siren', sirenValue);
          } catch (e) {
            logger.error(
              `Netatmo : File netatmo.updateCamera.js - Camera NOC ${this.devices[key].name} - siren - error : ${e}`,
            );
          }
        }
      } catch (e) {
        logger.error(`Netatmo : File netatmo.updateCamera.js - Camera NOC ${this.devices[key].name} - error : ${e}`);
      }
    }
    if (this.devices[key].type === 'NACamera') {
      if (this.devices[key].modules !== undefined) {
        this.devices[key].modules.forEach(async (module) => {
          const sidModule = module.id;
          const moduleExternalId = `netatmo:${sidModule}`;
          const moduleSelector = moduleExternalId.replace(/:/gi, '-');
          let deviceModule;
          try {
            deviceModule = await this.gladys.device.getBySelector(moduleSelector);
            try {
              // we save the common data of home coaches and weather stations
              if (module.type === 'NIS' || module.type === 'NACamDoorTag') {
                const batteryValue = module.battery_percent;
                await this.updateFeature(sidModule, deviceModule, moduleSelector, 'battery', batteryValue);
              }
            } catch (e) {
              logger.error(
                `Netatmo : File netatmo.updateCamera.js - Module NACamera ${module.type} ${module.name} - battery percent value - error : ${e}`,
              );
            }
            try {
              // we save other indoor sirens data
              if (module.type === 'NIS') {
                const sirenValue = NETATMO_VALUES.SECURITY.SIREN[module.status.toUpperCase()];
                await this.updateFeature(sidModule, deviceModule, moduleSelector, 'siren', sirenValue);
              }
            } catch (e) {
              logger.error(
                `Netatmo : File netatmo.updateCamera.js - Module NACamera ${module.name} - state - error : ${e}`,
              );
            }
            try {
              // we save other interior door / window opening detectors data
              if (module.type === 'NACamDoorTag') {
                const doorTagValue = NETATMO_VALUES.SECURITY.DOOR_TAG[module.status.toUpperCase()];
                await this.updateFeature(sidModule, deviceModule, moduleSelector, 'doorTag', doorTagValue);
              }
            } catch (e) {
              logger.error(
                `Netatmo : File netatmo.updateCamera.js - Module NACamera ${module.name} - state - error : ${e}`,
              );
            }
          } catch (e) {
            logger.debug(
              `Netatmo : File netatmo.updateCamera.js - device netatmo ${module.type ? module.type : '"type"'} ${
                module.name
              } no save in DB - error : ${e}`,
            );
          }
        });
      }
    }
  } catch (e) {
    logger.error(
      `Netatmo : File netatmo.updateCamera.js - Camera ${this.devices[key].type ? this.devices[key].type : '"type"'} ${
        this.devices[key].name
      } - error : ${e}`,
    );
  }
}

module.exports = {
  updateCamera,
};
