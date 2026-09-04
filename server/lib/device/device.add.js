const { DEVICE_POLL_FREQUENCIES } = require('../../utils/constants');

/**
 * @description Load device in memory.
 * @param {object} device - Device object.
 * @returns {null} Return when device was added.
 * @example
 * device.add(device);
 */
function add(device) {
  // A feature must be ONE object in RAM, whatever the store it is read from.
  // The stores merge an update into the object they already hold (Store.setState),
  // so a device saved a second time (edited in the UI, re-discovered by an
  // integration) kept the "deviceFeature" store on its first object, while the
  // "device" store pointed to the fresh objects of the new features array. From
  // then on, device.saveState only refreshed the former: anything reading a
  // feature through the device (the scene "toggle" actions, the switch/light
  // voice commands...) saw a last_value frozen at the time of the save, until
  // the next restart. Merging the new feature into the object already in RAM,
  // and putting that object back into the device, keeps every store in sync.
  device.features = device.features.map((feature) => {
    const featureInRam = this.stateManager.get('deviceFeature', feature.selector);
    if (featureInRam && featureInRam !== feature) {
      Object.assign(featureInRam, feature);
      return featureInRam;
    }
    return feature;
  });
  this.stateManager.setState('device', device.selector, device);
  this.stateManager.setState('deviceByExternalId', device.external_id, device);
  this.stateManager.setState('deviceById', device.id, device);
  device.features.forEach((feature) => {
    this.stateManager.setState('deviceFeature', feature.selector, feature);
    this.stateManager.setState('deviceFeatureById', feature.id, feature);
    this.stateManager.setState('deviceFeatureByExternalId', feature.external_id, feature);
  });
  if (device.should_poll === true && device.poll_frequency) {
    if (!this.devicesByPollFrequency[device.poll_frequency]) {
      this.devicesByPollFrequency[device.poll_frequency] = [];
    }
    // we only add the device to the poll frequency if the device was not in
    const deviceAlreadyInFrequencyIndex = this.devicesByPollFrequency[device.poll_frequency].findIndex(
      (d) => d.id === device.id,
    );
    if (deviceAlreadyInFrequencyIndex === -1) {
      this.devicesByPollFrequency[device.poll_frequency].push(device);
    } else {
      this.devicesByPollFrequency[device.poll_frequency][deviceAlreadyInFrequencyIndex] = device;
    }

    // foreach frequency
    Object.keys(DEVICE_POLL_FREQUENCIES).forEach((frequency) => {
      // if the frequency exist
      if (this.devicesByPollFrequency[DEVICE_POLL_FREQUENCIES[frequency]]) {
        // we see if the device is member of the group without being member
        const index = this.devicesByPollFrequency[DEVICE_POLL_FREQUENCIES[frequency]].findIndex(
          (d) => d.selector === device.selector && device.poll_frequency !== DEVICE_POLL_FREQUENCIES[frequency],
        );
        // if yes, we remove it
        if (index !== -1) {
          this.devicesByPollFrequency[DEVICE_POLL_FREQUENCIES[frequency]].splice(index, 1);
        }
      }
    });
  }
  // Handle MQTT custom topic
  const mqttService = this.serviceManager.getService('mqtt');
  if (mqttService) {
    mqttService.device.listenToCustomMqttTopicIfNeeded(device);
  }

  return null;
}

module.exports = {
  add,
};
