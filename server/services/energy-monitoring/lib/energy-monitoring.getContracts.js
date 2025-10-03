const axios = require('axios');
const logger = require('../../../utils/logger');

/**
 * @description Get energy contracts from GitHub releases.
 * @returns {Promise<Array>} Array of contracts.
 * @example
 * const contracts = await energyMonitoring.getContracts();
 */
async function getContracts() {
  try {
    logger.debug('Fetching energy contracts from GitHub releases');

    // Get the latest release from GitHub API
    const releaseResponse = await axios.get(
      'https://api.github.com/repos/GladysAssistant/energy-contracts/releases/latest',
    );
    const release = releaseResponse.data;

    // Find the contracts.json asset
    const contractsAsset = release.assets.find((asset) => asset.name === 'contracts.json');

    if (!contractsAsset) {
      throw new Error('contracts.json not found in the latest release');
    }

    // Download the contracts.json file
    const contractsResponse = await axios.get(contractsAsset.browser_download_url);
    const contracts = contractsResponse.data;

    // Validate that contracts is a valid JavaScript object
    if (!contracts || typeof contracts !== 'object') {
      throw new Error('contracts.json must be a valid JSON object');
    }

    const contractCount = Object.keys(contracts).length;
    logger.debug(`Successfully fetched ${contractCount} energy contracts`);

    return contracts;
  } catch (error) {
    logger.error('Error fetching energy contracts:', error);
    throw error;
  }
}

module.exports = {
  getContracts,
};
