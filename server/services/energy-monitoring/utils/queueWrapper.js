/**
 * @description Wrap a function to be executed in the queue.
 * @param {object} queue - The queue to use.
 * @param {Function} func - The function to wrap.
 * @returns {Promise<any>} The value returned by the function (null when it returns nothing).
 * @example
 * queueWrapper(queue, func);
 */
async function queueWrapper(queue, func) {
  return new Promise((resolve, reject) => {
    queue.push(async () => {
      try {
        const result = await func();
        resolve(result === undefined ? null : result);
      } catch (error) {
        reject(error);
      }
    });
  });
}

module.exports = { queueWrapper };
