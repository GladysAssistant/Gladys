/**
 * @description Wrap a function to be executed in the queue.
 * @param {object} queue - The queue to use.
 * @param {Function} func - The function to wrap.
 * @returns {Promise<null>} Return when finished.
 * @example
 * queueWrapper(queue, func);
 */
async function queueWrapper(queue, func) {
  return new Promise((resolve, reject) => {
    queue.push(async () => {
      try {
        await func();
        resolve(null);
      } catch (error) {
        reject(error);
      }
    });
  });
}

module.exports = { queueWrapper };
