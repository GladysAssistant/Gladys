/**
 * @description Get daily consumption.
 * @param {Object} device - Linky to poll.
 * @param {string} fromDate - First date to retrieve (format: YYYY-MM-DD).
 * @param {string} toDate - Last date to retrieve (format: YYYY-MM-DD).
 * @returns {Promise} Resolve with data.
 * @example
 * getLoadCurve(device);
 */
async function getLoadCurve(device, fromDate, toDate) {
  const session = await this.createSession(device);

  return session.getLoadCurve(fromDate, toDate);
}

module.exports = {
  getLoadCurve,
};
