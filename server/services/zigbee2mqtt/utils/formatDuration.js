/**
 * @description Format a duration for the logs: to the tenth of a second under a minute, to the second above.
 * @param {number} durationInMs - Duration in milliseconds.
 * @returns {string} The formatted duration, like "12.3 s" or "1 min 42 s".
 * @example
 * logger.info(`Image pulled in ${formatDuration(Date.now() - startedAt)}`);
 */
function formatDuration(durationInMs) {
  // Rounded before the comparison: 59.96 s is shown as "1 min 0 s", not as "60.0 s"
  const tenthsOfSecond = Math.round(durationInMs / 100);
  if (tenthsOfSecond < 600) {
    return `${(tenthsOfSecond / 10).toFixed(1)} s`;
  }
  const seconds = Math.round(durationInMs / 1000);
  return `${Math.floor(seconds / 60)} min ${seconds % 60} s`;
}

module.exports = {
  formatDuration,
};
