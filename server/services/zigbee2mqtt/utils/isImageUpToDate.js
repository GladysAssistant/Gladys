// Last status of a pull that downloaded nothing, "Status: Image is up to date for eclipse-mosquitto:2.0.15"
const UP_TO_DATE_STATUS = 'Status: Image is up to date for ';

/**
 * @description Tell whether a pull found the image already present, from the events it returned.
 * @param {Array} pullOutput - Docker events returned by the pull.
 * @returns {boolean} True when Docker downloaded nothing.
 * @example
 * const upToDate = isImageUpToDate(await gladys.system.pull('eclipse-mosquitto:2.0.15'));
 */
function isImageUpToDate(pullOutput) {
  return (
    Array.isArray(pullOutput) &&
    pullOutput.some((event) => event && typeof event.status === 'string' && event.status.startsWith(UP_TO_DATE_STATUS))
  );
}

module.exports = {
  isImageUpToDate,
};
