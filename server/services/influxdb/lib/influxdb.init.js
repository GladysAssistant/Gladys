/**
 * @description Prepares service and starts connection with broker.
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
