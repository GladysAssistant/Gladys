const Promise = require('bluebird');
const { BadParameters } = require('../../utils/coreErrors');
const db = require('../../models');
const { EVENTS } = require('../../utils/constants');
const { resolveEnergyParentId } = require('../../utils/resolveEnergyParentId');
const { getStandardDeviceIncludes } = require('../../utils/deviceQueryIncludes');
const logger = require('../../utils/logger');
const { syncFeatureSupportedOptions } = require('./device.syncFeatureSupportedOptions');

const getById = async (id) => {
  return db.Device.findOne({
    where: {
      id,
    },
    include: getStandardDeviceIncludes(),
  });
};

const getByExternalId = async (externalId) => {
  return db.Device.findOne({
    where: {
      external_id: externalId,
    },
    include: getStandardDeviceIncludes(),
  });
};

const getDeviceInDb = async (device) => {
  if (device.id) {
    const deviceById = await getById(device.id);
    if (deviceById) {
      return deviceById;
    }
  }
  const deviceByExternalId = await getByExternalId(device.external_id);
  return deviceByExternalId;
};

const matchFeatureInList = (existingFeature, features) => {
  // We are matching on both external_id and id, so we can match a device that changed external_id but kept the same id
  return features.find(
    (newFeature) => newFeature.id === existingFeature.id || newFeature.external_id === existingFeature.external_id,
  );
};

const matchParamInList = (existingParam, params) => {
  // We are matching on both name & id, so we can match a param that changed name but kept the same id
  return params.find((newParam) => newParam.id === existingParam.id || newParam.name === existingParam.name);
};

/**
 * @description Create a device, its feature and params.
 * @param {object} device - The device object to create.
 * @returns {Promise} Resolve with the device created.
 * @example
 * gladys.device.create({
 *  service_id: '90946a0d-5be2-4740-ac8b-26a2d78f12dd',
 *  name: 'Philips Hue Lamp 1',
 *  external_id: 'philips-hue:1'
 *  features: [{
 *    name: 'On/Off',
 *    external_id: 'philips-hue:1:binary',
 *    category: 'light',
 *    type: 'binary',
 *    read_only: false,
 *    keep_history: true,
 *    has_feedback: false,
 *    min: 0,
 *    max: 1
 *  }],
 *  params: [{
 *    name: 'IP_ADDRESS',
 *    value: '192.168.1.1'
 *  }]
 * });
 */
async function create(device) {
  // separate object
  const features = device.features || [];
  const params = device.params || [];
  delete device.features;
  delete device.params;

  let actionEvent = EVENTS.DEVICE.CREATE;
  let oldPollFrequency = null;

  const deviceFeaturesIdsToPurge = [];

  // we execute the whole insert in a transaction to avoid inconsistent state
  await db.sequelize.transaction(async (transaction) => {
    // external_id is a required parameter
    if (!device.external_id) {
      throw new BadParameters('A device must have an external_id.');
    }

    // first verify that device doesn't already exist
    let deviceInDb = await getDeviceInDb(device);

    let deviceToReturn = null;

    // if it doesn't exist, we create it
    if (deviceInDb === null) {
      deviceInDb = await db.Device.create(device, { transaction });
    } else {
      actionEvent = EVENTS.DEVICE.UPDATE;
      oldPollFrequency = deviceInDb.poll_frequency;

      // Remove MQTT subscription to custom MQTT topic
      const mqttService = this.serviceManager.getService('mqtt');
      if (mqttService) {
        mqttService.device.unListenToCustomMqttTopic(deviceInDb);
      }

      // or update it
      const deviceToUpdate = { ...device };
      delete deviceToUpdate.selector;
      await deviceInDb.update(deviceToUpdate, { transaction });

      // we delete all features which doesn't exist anymore
      await Promise.map(deviceInDb.features, async (existingFeature, index) => {
        if (!matchFeatureInList(existingFeature, features)) {
          await existingFeature.destroy({ transaction });
        }
      });

      // we delete all params which doesn't exist anymore
      await Promise.map(deviceInDb.params, async (existingParam) => {
        if (!matchParamInList(existingParam, params)) {
          await existingParam.destroy({ transaction });
        }
      });
    }

    deviceToReturn = deviceInDb.get({ plain: true });
    deviceToReturn.features = deviceToReturn.features || [];
    deviceToReturn.params = deviceToReturn.params || [];

    const energyParentIdByExternalId = new Map();
    const featuresToSave = features.map((feature) => {
      if (Object.prototype.hasOwnProperty.call(feature, 'energy_parent_id')) {
        energyParentIdByExternalId.set(feature.external_id, feature.energy_parent_id);
      }
      const featureToSave = { ...feature };
      delete featureToSave.energy_parent_id;
      delete featureToSave.supported_options;
      return featureToSave;
    });

    // Save features first without energy_parent_id, then resolve parent links in a second pass
    const newFeatures = await Promise.map(featuresToSave, async (feature) => {
      // if the device feature already exist
      const matchedFeature = matchFeatureInList(feature, deviceToReturn.features);
      if (matchedFeature) {
        const deviceFeature = await db.DeviceFeature.findOne({
          where: {
            id: matchedFeature.id,
          },
        });
        const featureToUpdate = { ...feature };
        delete featureToUpdate.selector;
        await deviceFeature.update(featureToUpdate, { transaction });
        if (deviceFeature.keep_history === false) {
          deviceFeaturesIdsToPurge.push(deviceFeature.id);
        }
        return deviceFeature.get({ plain: true });
      }
      // if not, we create it
      feature.device_id = deviceToReturn.id;
      const featureCreated = await db.DeviceFeature.create(feature, { transaction });
      return featureCreated.get({ plain: true });
    });

    await Promise.map(newFeatures, async (savedFeature) => {
      if (!energyParentIdByExternalId.has(savedFeature.external_id)) {
        return;
      }

      const requestedParentId = energyParentIdByExternalId.get(savedFeature.external_id);
      const validParentId = await resolveEnergyParentId(requestedParentId, { transaction });

      if (requestedParentId && !validParentId) {
        logger.warn(
          `Invalid energy_parent_id "${requestedParentId}" for feature "${savedFeature.selector}", clearing parent link`,
        );
      }

      if (savedFeature.energy_parent_id === validParentId) {
        return;
      }

      await db.DeviceFeature.update(
        { energy_parent_id: validParentId },
        { where: { id: savedFeature.id }, transaction },
      );
      savedFeature.energy_parent_id = validParentId;
    });

    deviceToReturn.features = await Promise.map(newFeatures, async (savedFeature) => {
      const payloadFeature = matchFeatureInList(savedFeature, features);
      if (!payloadFeature || !Object.prototype.hasOwnProperty.call(payloadFeature, 'supported_options')) {
        const existingFeature = matchFeatureInList(savedFeature, deviceToReturn.features);
        savedFeature.supported_options = existingFeature?.supported_options ?? [];
        return savedFeature;
      }

      savedFeature.supported_options = await syncFeatureSupportedOptions(
        savedFeature.id,
        payloadFeature.supported_options,
        transaction,
      );
      return savedFeature;
    });

    const newParams = await Promise.map(params, async (param) => {
      // if the param already already exist
      const matchedParam = matchParamInList(param, deviceToReturn.params);
      if (matchedParam) {
        const deviceParam = await db.DeviceParam.findOne({
          where: {
            id: matchedParam.id,
          },
        });
        await deviceParam.update(param, { transaction });
        return deviceParam.get({ plain: true });
      }
      // if not, we create it.
      param.device_id = deviceToReturn.id;
      const paramCreated = await db.DeviceParam.create(param, { transaction });
      return paramCreated.get({ plain: true });
    });
    deviceToReturn.params = newParams;

    return deviceToReturn;
  });

  // We purge states of all device features that were marked as "keep_history = false"
  // We do this asynchronously with an event, so it doesn't block the current request
  // Also, the function called will delete as slowly as possible the event
  // To make sure that Gladys is not locked during this time
  deviceFeaturesIdsToPurge.forEach((deviceFeatureIdToPurge) => {
    this.eventManager.emit(EVENTS.DEVICE.PURGE_STATES_SINGLE_FEATURE, deviceFeatureIdToPurge);
  });

  // we get the whole device from the DB to avoid
  // having a partial final object
  const newDevice = (await getByExternalId(device.external_id)).get({ plain: true });

  // save created device in RAM
  this.add(newDevice);

  // if the new device should be polled, poll
  if (newDevice.should_poll) {
    this.poll(newDevice);
  }
  const pollingWasDisabled = newDevice.should_poll === false && oldPollFrequency;
  const pollingWasUpdated = oldPollFrequency !== newDevice.poll_frequency;
  if (oldPollFrequency && (pollingWasDisabled || pollingWasUpdated)) {
    // Remove from poll
    const { [oldPollFrequency]: devices } = this.devicesByPollFrequency;
    const deviceIndex = devices.findIndex((d) => d.external_id === device.external_id);
    if (deviceIndex !== -1) {
      devices.splice(deviceIndex, 1);
    }
  }

  // notify device is succesfully created or updated
  this.notify(newDevice, actionEvent);

  return newDevice;
}

module.exports = {
  create,
};
