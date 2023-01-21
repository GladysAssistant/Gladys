/**
 * @description Send a notification.
 * @param {string} topic - The targeted topic.
 * @param {string} text - The message to send.
 * @example
 * send('gladys', 'thanks!');
 */
async function send(topic, text) {
  // We send the message to the ntfy service
  const service = this.service.getService('ntfy');
  // if the service exist
  if (service) {
    // we forward the message to Ntfy
    await service.notification.send(topic, { text });
  }
}

module.exports = {
  send,
};
