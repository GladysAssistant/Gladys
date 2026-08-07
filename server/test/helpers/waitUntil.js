const DEFAULT_TIMEOUT = 2000;
const DEFAULT_INTERVAL = 2;

/**
 * @description Poll a condition until it becomes true, and reject if it's still
 * false after the timeout. Useful to avoid relying on an arbitrary fixed delay
 * when waiting for an asynchronous side effect, which is flaky on slow machines.
 * @param {Function} condition - Function returning true when the expected state is reached.
 * @param {object} [options] - Options.
 * @param {number} [options.timeout] - Maximum time to wait, in ms.
 * @param {number} [options.interval] - Delay between two checks, in ms.
 * @param {string} [options.message] - Description of what is awaited, displayed when the timeout is reached.
 * @returns {Promise} Resolve when the condition is true.
 * @example
 * await waitUntil(() => device.setValue.called, { message: 'the scene to be executed' });
 */
function waitUntil(condition, options = {}) {
  const { timeout = DEFAULT_TIMEOUT, interval = DEFAULT_INTERVAL, message = 'condition to be true' } = options;
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeout;
    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() >= deadline) {
        reject(new Error(`Timed out after ${timeout}ms while waiting for ${message}`));
      } else {
        setTimeout(check, interval);
      }
    };
    check();
  });
}

module.exports = {
  waitUntil,
};
