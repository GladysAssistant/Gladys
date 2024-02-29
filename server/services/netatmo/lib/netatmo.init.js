/**
 * @description Initialize service with properties and connect to devices.
 * @example netatmo.init();
 */
async function init() {
  await this.getConfiguration();
  this.configured = true;
  await this.getAccessToken();
  await this.getRefreshToken();
  const response = await this.refreshingTokens();
  if (response.success) {
    await this.pollRefreshingToken();
    await this.refreshNetatmoValues();
    await this.pollRefreshingValues();
  }
}

module.exports = {
  init,
};
