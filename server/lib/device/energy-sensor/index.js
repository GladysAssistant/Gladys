const { getRootElectricMeterDevice } = require('./energy-sensor.getRootElectricMeterDevice');
const { getConsumptionByDates } = require('./energy-sensor.getConsumptionByDates');

const EnergySensorManager = function EnergySensorManager(stateManager) {
  this.stateManager = stateManager;
};

EnergySensorManager.prototype.getRootElectricMeterDevice = getRootElectricMeterDevice;
EnergySensorManager.prototype.getConsumptionByDates = getConsumptionByDates;

module.exports = EnergySensorManager;
