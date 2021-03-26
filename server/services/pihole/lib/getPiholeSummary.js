const { default: axios } = require('axios');
const logger = require('../../../utils/logger');


/**
 * @description Get the pihole summary datas.
 * @returns {Promise<Array>} Resolve with array of pihole summary datas.
 * @example
 * getPiholeSummary("3ebd27cb-42cf-4b32-a33c-135af7d62a37");
 */
async function getPiholeSummary() {
  const piholeip = await this.gladys.variable.getValue('PIHOLE_IP', this.serviceId);

  const url = `http://${piholeip}/admin/api.php?summaryRaw`;
  try {
    logger.debug(`PiHole summary URL : ${url}`);
    const { data } = await axios.get(url);
    logger.debug(`PiHole datas : ${JSON.stringify(data, null, 2)}`);
    return data;
  } catch (e) {
    logger.error(e);
    return null;
  }
  
}

module.exports = {
  getPiholeSummary,
};
