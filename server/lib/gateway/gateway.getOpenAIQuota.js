/**
 * @description Get OpenAI quota usage from Gladys Gateway.
 * @returns {Promise<object>} Quota for text and image AI requests.
 * @example
 * const quota = await getOpenAIQuota();
 */
async function getOpenAIQuota() {
  try {
    return await this.gladysGatewayClient.openAIGetQuota();
  } catch (e) {
    await this.throwIfPaymentRequired(e);
    throw e;
  }
}

module.exports = {
  getOpenAIQuota,
};
