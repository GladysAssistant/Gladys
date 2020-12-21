const logger = require('../../../../utils/logger');

/**
 * @description Handler Error from event
 * @returns devices
 * @example
 * getHealthyHomeCoachData();
 */
async function getHealthyHomeCoachData() {
  // we get the les homeCoachs
  new Promise((resolve, reject) => {
    this.api.getHealthyHomeCoachData((err, data) => {
      resolve(data);
    });
  })
  .then((homeCoaches) => {
    homeCoaches.forEach((homecoach) => {
      this.newValueHomeCoach(homecoach);
    });
  })
  .catch((err) => {
    logger.info(`Error on getHealthyHomeCoachData - ${err}`);
  });
}

module.exports = {
  getHealthyHomeCoachData,
};
