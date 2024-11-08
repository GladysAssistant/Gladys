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
        const { id, selector, name } = feature;

        // Modify EAST
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-current-summ-delivered`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EAST,
          };

          if (name === 'Index') {
            currentFields.name = 'Energie active délivrée totale (EAST)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EAIT
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-current-summ-received`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EAIT,
          };

          if (name === 'Index') {
            currentFields.name = 'Energie active injectée totale (EAIT)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EASF01
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-current-tier1-summ-delivered`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF01,
          };

          if (name === 'Index') {
            currentFields.name = 'Energie active soutirée fournisseur (EASF01)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EASF02
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-current-tier2-summ-delivered`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF02,
          };

          if (name === 'Index') {
            currentFields.name = 'Energie active soutirée fournisseur (EASF02)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EASF03
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-current-tier3-summ-delivered`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF03,
          };

          if (name === 'Index') {
            currentFields.name = 'Energie active soutirée fournisseur (EASF03)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EASF04
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-current-tier4-summ-delivered`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF04,
          };

          if (name === 'Index') {
            currentFields.name = 'Energie active soutirée fournisseur (EASF04)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EASF05
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-current-tier5-summ-delivered`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF05,
          };

          if (name === 'Index') {
            currentFields.name = 'Energie active soutirée fournisseur (EASF05)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EASF06
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-current-tier6-summ-delivered`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF06,
          };

          if (name === 'Index') {
            currentFields.name = 'Energie active soutirée fournisseur (EASF06)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EASF07
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-current-tier7-summ-delivered`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF07,
          };

          if (name === 'Index') {
            currentFields.name = 'Energie active soutirée fournisseur (EASF07)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EASF08
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-current-tier8-summ-delivered`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF08,
          };

          if (name === 'Index') {
            currentFields.name = 'Energie active soutirée fournisseur (EASF08)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EASF09
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-current-tier9-summ-delivered`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF09,
          };

          if (name === 'Index') {
            currentFields.name = 'Energie active soutirée fournisseur (EASF09)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EASF10
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-current-tier10-summ-delivered`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF10,
          };

          if (name === 'Index') {
            currentFields.name = 'Energie active soutirée fournisseur (EASF10)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify PREF
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT}-available-power`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.PREF,
          };

          if (name === 'Intensité') {
            currentFields.name = 'Puissance apparente référence (PREF)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify PCOUP
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT}-power-threshold`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.PCOUP,
          };

          if (name === 'Intensité') {
            currentFields.name = 'Puissance apparente coupure (PCOUP)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify CCASN
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-active-power`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.CCASN,
          };

          if (name === 'Puissance') {
            currentFields.name = 'Position de la courbe charge active (CCASN)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify CCASN-1 Position de la courbe charge active (CCASN-1)
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-active-power-ph-b`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.CCASN_1,
          };

          if (name === 'Puissance') {
            currentFields.name = 'Position de la courbe charge active (CCASN-1)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify UMOY1
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE}-average-rms-voltage-meas-period`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.UMOY1,
          };

          if (name === 'Tension') {
            currentFields.name = 'Tension moyenne (UMOY1)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify UMOY2
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE}-average-rms-voltage-measure-period-ph-b`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.UMOY2,
          };

          if (name === 'Tension') {
            currentFields.name = 'Tension moyenne (UMOY2)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify UMOY3
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE}-average-rms-voltage-meas-period-ph-c`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.UMOY3,
          };

          if (name === 'Tension') {
            currentFields.name = 'Tension moyenne (UMOY3)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify ERQ1
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-total-reactive-power`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.ERQ1,
          };

          if (name === 'Puissance') {
            currentFields.name = 'Puissance réactive Q1 totale (ERQ1)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify ERQ2
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-reactive-power`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.ERQ2,
          };

          if (name === 'Puissance') {
            currentFields.name = 'Puissance réactive Q2 totale (ERQ2)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify ERQ3
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-reactive-power-ph-b`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.ERQ3,
          };

          if (name === 'Puissance') {
            currentFields.name = 'Puissance réactive Q3 totale (ERQ3)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify ERQ4
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-reactive-power-ph-c`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.ERQ4,
          };

          if (name === 'Puissance') {
            currentFields.name = 'Puissance réactive Q4 totale (ERQ4)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify IRMS1
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT}-rms-current`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.IRMS1,
          };

          if (name === 'Intensité') {
            currentFields.name = 'Courant efficace (IRMS1)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify URMS1
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE}-rms-voltage`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.URMS1,
          };

          if (name === 'Tension') {
            currentFields.name = 'Tension efficace (URMS1)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify URMS2
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE}-rms-voltage-ph-b`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.URMS2,
          };

          if (name === 'Tension') {
            currentFields.name = 'Tension efficace (URMS2)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify URMS3
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE}-rms-voltage-ph-c`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.URMS3,
          };

          if (name === 'Tension') {
            currentFields.name = 'Tension efficace (URMS3)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EASD01
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-active-energy-out-d01`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EASD01,
          };

          if (name === 'Index') {
            currentFields.name = 'Energie active soutirée distributeur (EASD01)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EASD02
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-active-energy-out-d02`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EASD02,
          };

          if (name === 'Index') {
            currentFields.name = 'Energie active soutirée distributeur (EASD02)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EASD03
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-active-energy-out-d03`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EASD03,
          };

          if (name === 'Index') {
            currentFields.name = 'Energie active soutirée distributeur (EASD03)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify EASD04
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-active-energy-out-d04`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EASD04,
          };

          if (name === 'Index') {
            currentFields.name = 'Energie active soutirée distributeur (EASD04)';
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify NTARF
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX}-current-index-tarif`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.NTARF,
          };

          if (name === 'Index') {
            currentFields.name = `Numéro d'indice tarifaire (NTARF)`;
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify CCAIN
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-injected-active-load-n`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.CCAIN,
          };

          if (name === 'Puissance') {
            currentFields.name = `Point n de la courbe de charge active retirée (CCAIN)`;
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify CCAIN-1
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-injected-active-load-n1`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.CCAIN_1,
          };

          if (name === 'Puissance') {
            currentFields.name = `Point n-1 de la courbe de charge active retirée (CCAIN-1)`;
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify SINSTI
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-injected-v-a`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTI,
          };

          if (name === 'Puissance') {
            currentFields.name = `Puissance apparente instantanée injectée (SINSTI)`;
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify SMAXIN
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-injected-v-a-max-n`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXIN,
          };

          if (name === 'Puissance') {
            currentFields.name = `Puissance apparente max. injectée n (SMAXIN)`;
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify SMAXIN-1
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-injected-v-a-max-n1`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXIN_1,
          };

          if (name === 'Puissance') {
            currentFields.name = `Puissance apparente max. injectée n-1 (SMAXIN-1)`;
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify RELAIS
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.BINARY}-relais`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.BINARY,
          };

          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify SMAXN
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-active-power-max`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN,
          };

          if (name === 'Puissance') {
            currentFields.name = `Puissance apparente max. soutirée (SMAXN)`;
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify SMAXN2
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-active-power-max-ph-b`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN2,
          };

          if (name === 'Puissance') {
            currentFields.name = `Puissance apparente max. soutirée (SMAXN2)`;
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify SMAXN3
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-active-power-max-ph-c`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN3,
          };

          if (name === 'Puissance') {
            currentFields.name = `Puissance apparente max. soutirée (SMAXN3)`;
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify SINSTS
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-apparent-power`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS,
          };

          if (name === 'Puissance') {
            currentFields.name = `Puissance apparente instantanée soutirée (SINSTS)`;
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify SINSTS2
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-apparent-power-ph-b`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS2,
          };

          if (name === 'Puissance') {
            currentFields.name = `Puissance apparente instantanée soutirée (SINSTS2)`;
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify SINSTS3
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-apparent-power-ph-c`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS3,
          };

          if (name === 'Puissance') {
            currentFields.name = `Puissance apparente instantanée soutirée (SINSTS3)`;
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify SMAXN-1
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-drawn-v-a-max-n1`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN_1,
          };

          if (name === 'Puissance') {
            currentFields.name = `Puissance apparente max. soutirée n-1 (SMAXN-1)`;
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify SMAXN2-1
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-drawn-v-a-max-n1-p2`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN2_1,
          };

          if (name === 'Puissance') {
            currentFields.name = `Puissance apparente max. soutirée n-1 (SMAXN2-1)`;
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify SMAXN3-1
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER}-drawn-v-a-max-n1-p3`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN3_1,
          };

          if (name === 'Puissance') {
            currentFields.name = `Puissance apparente max. soutirée n-1 (SMAXN3-1)`;
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify IMAX
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT}-rms-current-max`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.IMAX,
          };

          if (name === 'Intensité') {
            currentFields.name = `Intensité maximale (IMAX)`;
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify IMAX2
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT}-rms-current-max-ph-b`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.IMAX2,
          };

          if (name === 'Intensité') {
            currentFields.name = `Intensité maximale (IMAX2)`;
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }

        // Modify IMAX3
        if (
          selector ===
          `${service.selector}-${lixeeTicdevice.selector}-${DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR}-${DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT}-rms-current-max-ph-c`
        ) {
          const currentFields = {
            category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
            type: DEVICE_FEATURE_TYPES.TELEINFORMATION.IMAX3,
          };

          if (name === 'Intensité') {
            currentFields.name = `Intensité maximale (IMAX3)`;
          }
          await feature.update(currentFields);
          logger.info(`Zigbee2mqtt migration: Updating device_feature ${id}`);
        }
      });
    });
  },
  down: async (queryInterface, Sequelize) => {},
};
