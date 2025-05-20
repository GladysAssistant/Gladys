const Promise = require('bluebird');

const logger = require('../../utils/logger');
const { SYSTEM_VARIABLE_NAMES, USER_ROLE } = require('../../utils/constants');

/**
 * @description Check if Gladys just upgraded.
 * @param {object} gateway - The gateway instance.
 * @param {number} waitTimeBetweenMessages - The time to wait between messages.
 * @example
 * await checkIfGladysUpgraded();
 */
async function checkIfGladysUpgraded(gateway, waitTimeBetweenMessages = 300) {
  try {
    const previousGladysVersion = await this.variable.getValue(SYSTEM_VARIABLE_NAMES.GLADYS_VERSION);
    if (this.gladysVersion && previousGladysVersion !== this.gladysVersion) {
      logger.info(`Gladys just upgraded from ${previousGladysVersion} to ${this.gladysVersion}`);

      // Send notifications to all admins
      const admins = await this.user.getByRole(USER_ROLE.ADMIN);
      await Promise.each(admins, async (admin) => {
        const message = this.brain.getReply(admin.language, 'gladys-upgraded.success', {
          previousGladysVersion,
          gladysVersion: this.gladysVersion,
        });
        await this.message.sendToUser(admin.selector, message);
        await Promise.delay(waitTimeBetweenMessages);
        const gladysVersionInfos = await gateway.getLatestGladysVersion();
        if (gladysVersionInfos.name === this.gladysVersion) {
          // If the user is french && there is a french release note link
          if (admin.language === 'fr' && gladysVersionInfos.fr_release_note_link) {
            // Send the release note to the user
            await this.message.sendToUser(admin.selector, gladysVersionInfos.fr_release_note_link);
          } else if (gladysVersionInfos.default_release_note_link) {
            // If there is no release note in french / or the user is not french, send the default one (english)
            await this.message.sendToUser(admin.selector, gladysVersionInfos.default_release_note_link);
          }
        }
      });

      await this.variable.setValue(SYSTEM_VARIABLE_NAMES.GLADYS_VERSION, this.gladysVersion);
    }
  } catch (e) {
    logger.error(e);
  }
}

module.exports = {
  checkIfGladysUpgraded,
};
