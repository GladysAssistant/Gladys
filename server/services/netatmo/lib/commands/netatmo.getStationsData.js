const logger = require('../../../../utils/logger');

/**
 * @description Get station data
 * @example
 * getStationsData();
 */
async function getStationsData() {
  // we get the thermostats
  new Promise((resolve, reject) => {
    this.api.getStationsData((err, data) => {
      resolve(data);
    });
  })
    .then((stations) => {
      stations.forEach((station) => {
        this.newValueStation(station);
      });
    })
    .catch((err) => {
      logger.info(`Error on getStationsData - ${err}`);
    });
}

module.exports = {
  getStationsData,
};
