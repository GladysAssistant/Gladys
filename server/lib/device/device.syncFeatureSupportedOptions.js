const Promise = require('bluebird');
const db = require('../../models');
const { normalizeSupportedOptions } = require('../../utils/normalizeSupportedOptions');

// The `value` model getter already resolves the value_string / value split, so both
// sides compare through the same polymorphic value
const matchSupportedOptionInList = (existingOption, options) => {
  return options.find((newOption) => newOption.id === existingOption.id || newOption.value === existingOption.value);
};

// A polymorphic option value maps onto the two storage columns, like
// last_value / last_value_string on t_device_feature: an integer goes to `value`, a
// string goes to `value_string` while `value` keeps a filler (the column is NOT NULL,
// and its partial unique index only covers rows without a value_string)
const toOptionColumns = (option) => {
  const valueIsString = typeof option.value === 'string';
  return {
    value: valueIsString ? 0 : option.value,
    value_string: valueIsString ? option.value : null,
  };
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
          ...toOptionColumns(option),
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
        ...toOptionColumns(option),
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
