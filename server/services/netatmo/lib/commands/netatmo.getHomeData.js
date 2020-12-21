const logger = require('../../../../utils/logger');

/**
 * @description Handler Error from event
 * @returns devices
 * @example
 * getHomeData();
 */
async function getHomeData() {
  // we get the cameras
  new Promise((resolve, reject) => {
    this.api.getHomeData((err, data) => {
      resolve(data.homes);
    });
  })
  .then((homes) => {
    homes.forEach((home) => {
      home.cameras.forEach((camera) => {
        this.newValueCamera(camera);
      });
    });
  })
  .catch((err) => {
    logger.info(`Error on getHomeData (camera) - ${err}`);
  });
}

module.exports = {
  getHomeData,
};
