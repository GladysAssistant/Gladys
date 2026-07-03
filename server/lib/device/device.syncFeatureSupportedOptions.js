const Promise = require('bluebird');
const db = require('../../models');
const { normalizeSupportedOptions } = require('../../utils/normalizeSupportedOptions');

const matchSupportedOptionInList = (existingOption, options) => {
  return options.find((newOption) => newOption.id === existingOption.id || newOption.value === existingOption.value);
};

/**
 * @description Sync supported options for a device feature.
 * @param {string} deviceFeatureId - The device feature id.
 * @param {Array} supportedOptions - The supported options payload.
 * @param {object} transaction - Sequelize transaction.
 * @returns {Promise<Array>} Saved supported options.
 * @example
 * syncFeatureSupportedOptions('fc235c88-b10d-4706-8b59-fef92a7119b2', [{ value: 1, label: 'On' }], transaction);
 */
async function syncFeatureSupportedOptions(deviceFeatureId, supportedOptions, transaction) {
  const normalizedOptions = normalizeSupportedOptions(supportedOptions);

  const existingOptions = await db.DeviceFeatureSupportedOption.findAll({
    where: {
      device_feature_id: deviceFeatureId,
    },
    transaction,
  });

  await Promise.map(existingOptions, async (existingOption) => {
    if (!matchSupportedOptionInList(existingOption, normalizedOptions)) {
      await existingOption.destroy({ transaction });
    }
  });

  const savedOptions = await Promise.map(normalizedOptions, async (option) => {
    const matchedOption = existingOptions.find(
      (existingOption) => existingOption.id === option.id || existingOption.value === option.value,
    );

    if (matchedOption) {
      await matchedOption.update(
        {
          value: option.value,
          label: option.label,
          sort_order: option.sort_order,
        },
        { transaction },
      );
      return matchedOption.get({ plain: true });
    }

    const createdOption = await db.DeviceFeatureSupportedOption.create(
      {
        device_feature_id: deviceFeatureId,
        value: option.value,
        label: option.label,
        sort_order: option.sort_order,
      },
      { transaction },
    );
    return createdOption.get({ plain: true });
  });

  return savedOptions.sort((a, b) => a.sort_order - b.sort_order);
}

module.exports = {
  syncFeatureSupportedOptions,
};
