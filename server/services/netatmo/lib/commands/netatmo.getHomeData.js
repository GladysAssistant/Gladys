const axios = require('axios');
const logger = require('../../../../utils/logger');
/**
 * @description Get Home Data
 * @example
 * getHomeData();
 */
async function getHomeData() {
  // we get the cameras gethomedata
  try {
    const response = await axios.post(`${this.baseUrl}/api/gethomedata`, { access_token: this.token });
    if (response.data.body.homes !== undefined) {
      response.data.body.homes.forEach((home) => {
        if (home.cameras !== undefined) {
          home.cameras.forEach((camera) => {
            const sid = camera.id;
            if (this.devices[sid] === undefined) {
              this.newValueCamera(camera);
            }
            this.devices[sid] = camera;
          });
        } else {
          logger.info(`Files getHomeData (camera) - No data cameras`);
        }
      });
    } else {
      logger.info(`Files getHomeData (camera) - No data devices`);
    }
  } catch (err) {
    logger.info(`Error on getHomeData (camera) - ${err}`);
  }
}

module.exports = {
  getHomeData,
};
