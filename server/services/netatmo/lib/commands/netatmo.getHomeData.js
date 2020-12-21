const logger = require('../../../../utils/logger');

/**
 * @description Handler Error from event
 * @returns devices
 * @example
 * getHomeData();
 */
async function getHomeData() {
  // we get the thermostats
  new Promise((resolve, reject) => {
    this.api.getHomeData((err, data) => {
      resolve(data.homes);
    });
  })
  .then((homes) => {
    homes.forEach((home) => {
      // then we get the cameras
      home.cameras.forEach((camera) => {
        this.newValueCamera(camera);
      });
    });
  })
  .catch(() => {
    logger.info('Aucune camera')
  })
}

module.exports = {
  getHomeData,
};
