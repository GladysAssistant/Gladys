const Promise = require('bluebird');
const db = require('../models');
const logger = require('../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../utils/constants');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get Zigbee2mqtt service
    const service = await db.Service.findOne({
      where: {
        name: 'zigbee2mqtt',
      },
    });
    if (service === null) {
      logger.info('Zigbee2mqtt service not found.');
      return;
    }
    logger.info(`Zigbee2mqtt migration: Found service zigbee2mqtt = ${service.id}`);
    const zigbee2mqttDevices = await db.Device.findAll({
      where: {
        service_id: service.id,
      },
    });
    logger.info(`Zigbee2mqtt migration: Found ${zigbee2mqttDevices.length} zigbee2mqtt devices`);

    const lixeeTicdevices = await db.Device.findAll({
      where: {
        model: `ZLinky_TIC`,
      },
    });
    logger.info(`Zigbee2mqtt migration: Found ${lixeeTicdevices.length} lixee-tic devices`);

    await Promise.each(lixeeTicdevices, async (lixeeTicdevice) => {
      // Load impacted features
      const features = await db.DeviceFeature.findAll({
        where: {
          device_id: lixeeTicdevice.id,
        },
      });
      logger.info(`Zigbee2mqtt migration: Found ${features.length} Linky_TIC features`);

      await Promise.mapSeries(features, async (feature) => {
        const { id, selector, external_id: externalId } = feature;

        // Modify EAST
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-current-summ-delivered`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EAST}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EAST}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EAIT
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-current-summ-received`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EAIT}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EAIT}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EASF01
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-current-tier1-summ-delivered`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF01}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF01}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EASF02
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-current-tier2-summ-delivered`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF02}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF02}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EASF03
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-current-tier3-summ-delivered`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF03}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF03}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EASF04
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-current-tier4-summ-delivered`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF04}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF04}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EASF05
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-current-tier5-summ-delivered`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF05}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF05}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EASF06
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-current-tier6-summ-delivered`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF06}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF06}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EASF07
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-current-tier7-summ-delivered`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF07}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF07}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EASF08
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-current-tier8-summ-delivered`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF08}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF08}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EASF09
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-current-tier9-summ-delivered`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF09}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF09}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EASF10
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-current-tier10-summ-delivered`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF10}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF10}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify PREF
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT}-available-power`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.PREF}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.PREF}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify PCOUP
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT}-power-threshold`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.PCOUP}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.PCOUP}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify CCASN
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-active-power`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.CCASN}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.CCASN}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify CCASN-1 Position de la courbe charge active (CCASN-1)
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-active-power-ph-b`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.CCASN_1}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.CCASN_1}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify UMOY1
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE}-average-rms-voltage-meas-period`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.UMOY1}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.UMOY1}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify UMOY2
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE}-average-rms-voltage-measure-period-ph-b`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.UMOY2}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.UMOY2}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify UMOY3
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE}-average-rms-voltage-meas-period-ph-c`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.UMOY3}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.UMOY3}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify ERQ1
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-total-reactive-power`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.ERQ1}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.ERQ1}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify ERQ2
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-reactive-power`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.ERQ2}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.ERQ2}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify ERQ3
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-reactive-power-ph-b`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.ERQ3}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.ERQ3}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify ERQ4
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-reactive-power-ph-c`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.ERQ4}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.ERQ4}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify IRMS1
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT}-rms-current`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.IRMS1}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.IRMS1}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify URMS1
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE}-rms-voltage`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.URMS1}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.URMS1}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify URMS2
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE}-rms-voltage-ph-b`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.URMS2}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.URMS2}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify URMS3
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE}-rms-voltage-ph-c`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.URMS3}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.URMS3}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EASD01
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-active-energy-out-d01`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EASD01}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EASD01}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EASD02
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-active-energy-out-d02`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EASD02}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EASD02}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EASD03
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-active-energy-out-d03`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EASD03}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EASD03}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EASD04
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-active-energy-out-d04`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EASD04}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.EASD04}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify NTARF
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-current-index-tarif`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.NTARF}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.NTARF}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify CCAIN
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-injected-active-load-n`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.CCAIN}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.CCAIN}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify CCAIN-1
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-injected-active-load-n1`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.CCAIN_1}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.CCAIN_1}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify SINSTI
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-injected-v-a`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTI}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTI}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify SMAXIN
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-injected-v-a-max-n`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXIN}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXIN}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify SMAXIN-1
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-injected-v-a-max-n1`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXIN_1}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXIN_1}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify RELAIS
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.BINARY}-relais`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.BINARY}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.BINARY}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.BINARY}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.BINARY}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify SMAXN
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-active-power-max`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify SMAXN2
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-active-power-max-ph-b`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN2}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN2}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify SMAXN3
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-active-power-max-ph-c`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN3}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN3}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify SINSTS
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-apparent-power`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify SINSTS2
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-apparent-power-ph-b`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS2}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS2}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify SINSTS3
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-apparent-power-ph-c`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS3}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS3}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify SMAXN-1
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-drawn-v-a-max-n1`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN_1}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN_1}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify SMAXN2-1
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-drawn-v-a-max-n1-p2`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN2_1}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN2_1}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify SMAXN3-1
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-drawn-v-a-max-n1-p3`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN3_1}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN3_1}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify IMAX
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT}-rms-current-max`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.IMAX}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.IMAX}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify IMAX2
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT}-rms-current-max-ph-b`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.IMAX2}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.IMAX2}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify IMAX3
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT}-rms-current-max-ph-c`
        ) {
          const featureSelector = selector
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.IMAX3}`);

          const featureExternalId = externalId
            .replace(`${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}`, `${DEVICE_FEATURE_CATEGORIES.TELEINFORMATION}`)
            .replace(`${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT}`, `${DEVICE_FEATURE_TYPES.TELEINFORMATION.IMAX3}`);

          const currentFields = {
            selector: featureSelector,
            external_id: featureExternalId,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }
      });
    });
  },
  down: async (queryInterface, Sequelize) => {},
};
