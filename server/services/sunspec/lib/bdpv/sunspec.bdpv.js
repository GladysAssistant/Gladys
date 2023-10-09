const axios = require('axios');
const cron = require('node-cron');
const logger = require('../../../../utils/logger');
const { CONFIGURATION, BDPV } = require('../sunspec.constants');
const { DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

/**
 * @description SunSpec push device to BDPV.
 * @example sunspec.bdpvPush();
 */
async function bdpvPush() {
  const index = this.getDevices()
    .filter((device) => device.external_id.indexOf('mppt:ac') > 0)
    .map((device) =>
      device.features.filter((deviceFeature) => deviceFeature.type === DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY),
    )
    .filter((deviceFeatures) => deviceFeatures.length > 0)
    .map((deviceFeatures) => deviceFeatures[0])
    .map((deviceFeature) => {
      const gladysFeature = this.gladys.stateManager.get('deviceFeature', deviceFeature.selector);
      return gladysFeature.last_value;
    })
    .reduce((total, item) => total + item);
  try {
    this.bdpvParams.index = index * 1000; // must be in Wh
    const response = await this.bdpvClient.get(BDPV.URL, {
      params: this.bdpvParams,
    });
    logger.info(`BDPV push ${this.bdpvParams.index} (status: ${response.status})`);
  } catch (e) {
    logger.error(`Fail to push to BDPV: ${e}`);
  }
}

/**
 * @description SunSpec init push to BDPV.
 * @param {boolean} bdpvActive - Activate BDPV index push.
 * @example sunspec.bdpvInit(true);
 */
async function bdpvInit(bdpvActive) {
  if (bdpvActive) {
    if (this.bdpvClient === undefined) {
      const bdpvUsername = await this.gladys.variable.getValue(CONFIGURATION.SUNSPEC_BDPV_USER_NAME, this.serviceId);
      const bdpvApiKey = await this.gladys.variable.getValue(CONFIGURATION.SUNSPEC_BDPV_API_KEY, this.serviceId);
      if (bdpvUsername === null || bdpvApiKey === null) {
        return;
      }

      this.bdpvClient = axios.create({
        timeout: 10000,
      });
      this.bdpvParams = {
        util: bdpvUsername,
        apiKey: bdpvApiKey,
        typeReleve: BDPV.TYPE_RELEVE,
        source: BDPV.SOURCE,
      };
    }

    if (this.bdpvTask === undefined) {
      this.bdpvTask = cron.schedule(BDPV.CRON, await bdpvPush.bind(this), {
        scheduled: false,
      });
      logger.info(`Starting BDPV push ${BDPV.CRON}`);
    }

    this.bdpvTask.start();
  } else if (this.bdpvTask) {
    this.bdpvTask.stop();
  }
}

module.exports = {
  bdpvInit,
  bdpvPush,
};
