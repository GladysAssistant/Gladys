const fs = require('fs');
const path = require('path');

const logger = require('../../utils/logger');
const { SYSTEM_VARIABLE_NAMES, USER_ROLE } = require('../../utils/constants');
const { Error429 } = require('../../utils/httpErrors');
const { extractAssistantMessage } = require('./gateway.forwardMessageToAiChat');

const promptPath = path.join(__dirname, '../../config/prompts/weeklyDigest.prompt.txt');
const WEEKLY_DIGEST_PROMPT = fs.readFileSync(promptPath, 'utf8');

/**
 * @description Check if a system variable value means enabled.
 * @param {any} value - Variable value.
 * @returns {boolean} True when enabled.
 * @example
 * isSystemVariableEnabled('1');
 */
function isSystemVariableEnabled(value) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

/**
 * @description Extract assistant text from AI chat response.
 * @param {object} apiResponse - Chat API response.
 * @returns {string} Assistant text.
 * @example
 * extractAssistantText({ choices: [{ message: { content: 'Hello' } }] });
 */
function extractAssistantText(apiResponse) {
  const assistantMessage = extractAssistantMessage(apiResponse);
  const content = assistantMessage?.content;
  return typeof content === 'string' ? content.trim() : '';
}

/**
 * @description Send the weekly smart home digest to admin users.
 * @param {object} [options] - Options.
 * @param {boolean} [options.force=false] - Skip enabled check.
 * @returns {Promise<{sent: number}>} Number of digests sent.
 * @example
 * sendWeeklyDigest();
 */
async function sendWeeklyDigest({ force = false } = {}) {
  if (!force) {
    const enabled = await this.variable.getValue(SYSTEM_VARIABLE_NAMES.AI_WEEKLY_DIGEST_ENABLED);
    if (!isSystemVariableEnabled(enabled)) {
      return { sent: 0 };
    }
  }

  const status = await this.getStatus();
  if (!status.configured) {
    logger.debug('Weekly digest skipped: Gladys Plus is not configured.');
    return { sent: 0 };
  }

  if (!this.device || !this.scene) {
    logger.warn('Weekly digest skipped: device or scene manager is not available.');
    return { sent: 0 };
  }

  const admins = await this.user.getByRole(USER_ROLE.ADMIN);
  if (!admins.length) {
    return { sent: 0 };
  }

  const digestData = await this.buildWeeklyDigestData();
  let sent = 0;

  await Promise.all(
    admins.map(async (admin) => {
      try {
        const apiResponse = await this.aiChat({
          messages: [
            { role: 'system', content: WEEKLY_DIGEST_PROMPT },
            {
              role: 'user',
              content: `Language: ${admin.language}\n\nHome data JSON:\n${JSON.stringify(digestData)}`,
            },
          ],
          max_tokens: 800,
        });

        const digestText = extractAssistantText(apiResponse);
        if (!digestText) {
          logger.warn(`Weekly digest empty for user ${admin.selector}`);
          return;
        }

        await this.message.sendToUser(admin.selector, digestText);
        sent += 1;
      } catch (e) {
        if (e instanceof Error429) {
          logger.warn('Weekly digest skipped: AI rate limit reached.');
          return;
        }
        logger.warn(`Weekly digest failed for user ${admin.selector}`, e);
      }
    }),
  );

  return { sent };
}

module.exports = {
  sendWeeklyDigest,
  isSystemVariableEnabled,
  extractAssistantText,
};
