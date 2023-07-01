// const { mappings } = require('./deviceMappings');
const fs = require('fs/promises');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  EVENTS,
} = require('../../../utils/constants');
const { appMappings } = require('./mappings');

/**
 * @description Create an Android TV.
 * @param {object} device - Gladys device to format as Android TV.
 * @returns {Promise} Android TV recently build.
 * @example
 * buildTV(device)
 */
async function buildTV(device) {
  const address = device.params.find(param => param.name === 'ANDROID_TV_IP');

  if (!address) {
    return;
  }

  if (this.androidTVs[device.id]) {
    try {
      this.androidTVs[device.id].stop();
    } catch (error) {
      console.log('Android TV already stopped');
    }
    delete this.androidTVs[device.id];
  }

  const port = 6466;

  let cert;
  let key;
  try {
    cert = await fs.readFile(`${this.basePathAndroidTV}/${device.id}-cert.pem`);
    key = await fs.readFile(`${this.basePathAndroidTV}/${device.id}-key.pem`);
  } catch (error) {
    console.log('Can\'t read file');
  }

  const options = {
    remote_port: port,
    pairing_port: port + 1,
    name: device.name,
    cert: {
      cert,
      key,
    },
  };

  const androidRemote = new this.androidtv.AndroidRemote(address.value, options);

  androidRemote.on('secret', () => {
    console.log('Ask for secret');
  });

  androidRemote.on('powered', (powered) => {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: device.features.find((feat) => (
        feat.category === DEVICE_FEATURE_CATEGORIES.TELEVISION &&
        feat.type === DEVICE_FEATURE_TYPES.TELEVISION.BINARY)
      ).external_id,
      state: powered ? 1 : 0,
    });
  });

  androidRemote.on('volume', async (volume) => {
    const feature = device.features.find((feat) => (
      feat.category === DEVICE_FEATURE_CATEGORIES.TELEVISION &&
      feat.type === DEVICE_FEATURE_TYPES.TELEVISION.VOLUME)
    );
    if (feature.max !== volume.maximum) {
      await this.gladys.device.addFeature(device.selector, {
        ...feature,
        max: volume.maximum,
      });
    }
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: feature.external_id,
      state: volume.mute ? 0 : volume.level,
    });
  });

  androidRemote.on('current_app', (currentApp) => {
    const feature = device.features.find((feat) => (
      feat.category === DEVICE_FEATURE_CATEGORIES.TEXT &&
      feat.type === DEVICE_FEATURE_TYPES.TEXT.TEXT)
    );
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: feature.external_id,
      text: appMappings[currentApp] ? appMappings[currentApp] : currentApp,
    });
  });

  androidRemote.on('ready', async () => {
    const { cert: newCert, key: newKey } = androidRemote.getCertificate();

    await fs.writeFile(`${this.basePathAndroidTV}/${device.id}-cert.pem`, newCert);
    await fs.writeFile(`${this.basePathAndroidTV}/${device.id}-key.pem`, newKey);
  });

  androidRemote.start();
  this.androidTVs[device.id] = androidRemote;
}

module.exports = {
  buildTV,
};
