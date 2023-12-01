/**
 * @description Create eWeLink client.
 * @example
 * this.createClient();
 */
async function createClient() {
  const { applicationId, applicationSecret, applicationRegion } = this.configuration;

  this.ewelinkClient = new this.eweLinkApi.WebAPI({
    appId: applicationId,
    appSecret: applicationSecret,
    region: applicationRegion,
  });
}

module.exports = {
  createClient,
};
