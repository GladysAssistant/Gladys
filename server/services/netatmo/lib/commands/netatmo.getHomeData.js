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
    response.data.body.homes.forEach((home) => {
      home.cameras.forEach((camera) => {
        const sid = camera.id;
        if (this.devices[sid] === undefined) {
          this.newValueCamera(camera);
        }
        this.devices[sid] = camera;
      });
    });
  } catch (err) {
    logger.info(`Error on getHomeData (camera) - ${err}`);
  }
}

module.exports = {
  getHomeData,
};
