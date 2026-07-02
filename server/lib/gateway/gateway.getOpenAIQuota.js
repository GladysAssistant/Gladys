/**
 * @description Get OpenAI quota usage from Gladys Gateway.
 * @returns {Promise<object>} Quota for text and image AI requests.
 * @example
 * const quota = await getOpenAIQuota();
 */
async function getOpenAIQuota() {
  return this.gladysGatewayClient.openAIGetQuota();
}

module.exports = {
  getOpenAIQuota,
};
