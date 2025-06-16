/**
 * @description Initialize service with properties and connect to devices.
 * @example tessie.init();
 */
async function init() {
  await this.getConfiguration();
  this.configured = true;
  await this.connect();
  console.log('Tessiethis.vehicles', this.vehicles);

  if (this.vehicles && this.vehicles.length > 0) {
    // await this.refreshTessieValues();
    // await this.pollRefreshingValues();
  }
}

module.exports = {
  init,
};
