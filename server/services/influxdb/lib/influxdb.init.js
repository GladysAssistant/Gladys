/**
 * @description Get configuration and start listening on state events.
 * @example
 * init();
 */
async function init() {
  const configuration = await this.getConfiguration();
  await this.listen(configuration);
}

module.exports = {
  init,
};
