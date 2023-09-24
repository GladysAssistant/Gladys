const axios = require('axios');
const cron = require('node-cron');
const logger = require('../../../../utils/logger');
const { CONFIGURATION, PROPERTY } = require('../sunspec.constants');

const BDPV_HOST = 'https://www.bdpv.fr/webservice/majProd';

/**
 * @description SunSpec push device to BDPV.
 * @example sunspec.bdpvPush();
 */
async function bdpvPush() {
  const index = this.getDevices()
    .filter((device) => device.mppt === undefined)
    .map((device) => device.features.filter((deviceFeature) => deviceFeature.property === PROPERTY.ACWH))
    .map((deviceFeature) => {
      const gladysFeature = this.gladys.stateManager.get('deviceFeature', deviceFeature.selector);
      return gladysFeature.last_value;
    })
    .reduce((total, item) => total + item);
  try {
    this.bdpvParams.index = index * 1000; // must be in Wh
    const response = await this.bdpvClient.get('expeditionProd_v3.php', {
      params: this.bdpvParams,
    });
    logger.info(`BDPV push ${response.status}`);
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
        baseURL: BDPV_HOST,
        timeout: 10000,
      });
      this.bdpvParams = {
        util: bdpvUsername,
        apiKey: bdpvApiKey,
        typeReleve: 'onduleur',
        source: 'Gladys',
      };
    }

    if (this.bdpvTask === undefined) {
      this.bdpvTask = cron.schedule('10 23 * * *', bdpvPush.bind(this), {
        scheduled: false,
      });
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
