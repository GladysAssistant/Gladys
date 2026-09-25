/**
 * @description The community energy contracts catalogue (`GladysAssistant/energy-contracts`
 * latest release): kept for compatibility, it now answers through the energy contract
 * manager which prefers `contracts-v2.json` and converts `contracts.json` otherwise.
 * The v1 file is returned in its original shape when it is the only one published.
 * @returns {Promise<object>} The catalogue.
 * @example
 * const contracts = await energyMonitoring.getContracts();
 */
async function getContracts() {
  const catalogue = await this.gladys.energyContract.getCatalogue();
  if (catalogue.format === 1) {
    return catalogue.raw;
  }
  return { templates: catalogue.templates, calendars: catalogue.calendars, version: catalogue.version };
}

module.exports = {
  getContracts,
};
