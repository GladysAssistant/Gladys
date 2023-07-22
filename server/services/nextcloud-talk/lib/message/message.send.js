const uuid = require('uuid');
const logger = require('../../../../utils/logger');

/**
 * @description Send Nextcloud Talk message.
 * @param {string} token - Nextcloud Talk token.
 * @param {object} message - Message object to send.
 * @returns {Promise} - Resolve.
 * @example
 * send('1abcd2ef', {
 *   text: 'Hey'
 * });
 */
async function send(token, message) {
  logger.debug(`Sending Nextcloud Talk message to user with token = ${token}.`);

  const userBot = Object.values(this.bots).find((bot) => bot.token === token);

  const NEXTCLOUD_URL = await this.gladys.variable.getValue('NEXTCLOUD_URL', this.serviceId, userBot.userId);
  const NEXTCLOUD_BOT_USERNAME = await this.gladys.variable.getValue(
    'NEXTCLOUD_BOT_USERNAME',
    this.serviceId,
    userBot.userId,
  );
  const NEXTCLOUD_BOT_PASSWORD = await this.gladys.variable.getValue(
    'NEXTCLOUD_BOT_PASSWORD',
    this.serviceId,
    userBot.userId,
  );

  if (!NEXTCLOUD_URL || !NEXTCLOUD_BOT_USERNAME || !NEXTCLOUD_BOT_PASSWORD) {
    logger.debug(`Missing correct config for Netxcloud Talk with token = ${token}.`);
    return;
  }

  const headers = {
    Authorization: `Basic ${Buffer.from(`${NEXTCLOUD_BOT_USERNAME}:${NEXTCLOUD_BOT_PASSWORD}`).toString('base64')}`,
    Accept: 'application/json',
    'OCS-APIRequest': true,
  };

  await this.gladys.http.request(
    'post',
    `${NEXTCLOUD_URL}/ocs/v2.php/apps/spreed/api/v1/chat/${userBot.token}`,
    { message: message.text },
    headers,
  );
  if (message.file) {
    const now = new Date();
    const id = `${now.getFullYear()}-${now.getMonth() +
      1}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}${uuid.v4().split('-')[0]}`;

    const path = `/Talk/${id}.jpg`;
    await this.gladys.http.request(
      'put',
      `${NEXTCLOUD_URL}/remote.php/dav/files/${NEXTCLOUD_BOT_USERNAME}${path}`,
      Buffer.from(message.file.substr(17), 'base64'),
      {
        ...headers,
        'Content-Type': 'image/jpg',
      },
    );
    await this.gladys.http.request(
      'post',
      `${NEXTCLOUD_URL}/ocs/v2.php/apps/files_sharing/api/v1/shares`,
      {
        path,
        shareType: 10,
        shareWith: userBot.token,
      },
      headers,
    );
  }
}

module.exports = {
  send,
};
