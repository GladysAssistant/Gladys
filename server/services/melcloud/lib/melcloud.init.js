/**
 * @description Initialize service with properties and connect to devices.
 * @example
 * await init();
 */
async function init() {
  const configuration = await this.getConfiguration();
  await this.connect(configuration);
}

module.exports = {
  init,
};
