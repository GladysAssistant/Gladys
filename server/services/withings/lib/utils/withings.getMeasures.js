/**
 * @description Returns list of withings measures (after call to withings server).
 *
 * @param {string} userId - Gladys userId of current session.
 * @param {string} params - Additionnal params to get measures (optional).
 * @returns {object} List of withings measures.
 * @example
 * getMeasures('rzede-jlkunv-rze23f-csdcs-fsdfsd')
 */
function getMeasures(userId, params) {
  let actionRequest = 'action=getmeas';
  if (params) {
    actionRequest += params;
  }
  return this.oauth2Client.executeQuery(this.serviceId, userId, 'get', `${this.withingsUrl}/measure`, actionRequest);
}

module.exports = {
  getMeasures,
};
