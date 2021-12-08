const EventEmitter = require('events');
const get = require('get-value');
const logger = require('../../../../utils/logger');

class NextcloudTalkBot extends EventEmitter {
  constructor(gladys, serviceId, userId, token) {
    super();
    this.gladys = gladys;
    this.serviceId = serviceId;
    this.userId = userId;
    this.token = token;
    this.isPolling = false;
  }

  async startPolling() {
    logger.debug(`Start polling Nextcloud Talk for token: ${this.token}`);

    const user = await this.gladys.user.getById(this.userId);

    if (!this.NEXTCLOUD_URL) {
      this.NEXTCLOUD_URL = await this.gladys.variable.getValue('NEXTCLOUD_URL', this.serviceId, user.id);
    }
    if (!this.NEXTCLOUD_BOT_USERNAME) {
      this.NEXTCLOUD_BOT_USERNAME = await this.gladys.variable.getValue(
        'NEXTCLOUD_BOT_USERNAME',
        this.serviceId,
        user.id,
      );
    }
    if (!this.NEXTCLOUD_BOT_PASSWORD) {
      this.NEXTCLOUD_BOT_PASSWORD = await this.gladys.variable.getValue(
        'NEXTCLOUD_BOT_PASSWORD',
        this.serviceId,
        user.id,
      );
    }

    this.isPolling = true;
    this.poll();
  }

  stopPolling() {
    logger.debug(`Stop polling Nextcloud Talk for token: ${this.token}`);
    this.isPolling = false;
  }

  async poll(lastKnownMessageId) {
    const result = await this.gladys.http.request(
      'get',
      `${this.NEXTCLOUD_URL}/ocs/v2.php/apps/spreed/api/v1/chat/${this.token}?lookIntoFuture=1&timeout=15${
        lastKnownMessageId ? `&lastKnownMessageId=${lastKnownMessageId}` : ''
      }`,
      '',
      {
        Authorization: `Basic ${Buffer.from(`${this.NEXTCLOUD_BOT_USERNAME}:${this.NEXTCLOUD_BOT_PASSWORD}`).toString(
          'base64',
        )}`,
        Accept: 'application/json',
        'OCS-APIRequest': true,
      },
    );
    const newMessages = get(result, 'data.ocs.data');
    if (
      lastKnownMessageId &&
      newMessages &&
      newMessages[newMessages.length - 1].actorId !== this.NEXTCLOUD_BOT_USERNAME
    ) {
      this.emit('message', newMessages.pop());
    }

    if (this.isPolling) {
      setTimeout(() => this.poll(result.headers['x-chat-last-given'] || lastKnownMessageId), 50);
    }
  }
}

module.exports = NextcloudTalkBot;
