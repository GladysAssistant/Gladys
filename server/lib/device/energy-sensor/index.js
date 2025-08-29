const { getRootElectricMeterDevice } = require('./energy-sensor.getRootElectricMeterDevice');

const EnergySensorManager = function EnergySensorManager(stateManager) {
  this.stateManager = stateManager;
};

EnergySensorManager.prototype.getRootElectricMeterDevice = getRootElectricMeterDevice;

module.exports = EnergySensorManager;
