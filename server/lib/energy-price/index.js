const { get } = require('./price.get');
const { create } = require('./price.create');
const { update } = require('./price.update');
const { destroy } = require('./price.destroy');
const { getDefaultElectricMeterFeatureId } = require('./price.getDefaultElectricMeterFeatureId');

const EnergyPrice = function EnergyPrice(stateManager) {
  this.stateManager = stateManager;
};

EnergyPrice.prototype.get = get;
EnergyPrice.prototype.create = create;
EnergyPrice.prototype.update = update;
EnergyPrice.prototype.destroy = destroy;
EnergyPrice.prototype.getDefaultElectricMeterFeatureId = getDefaultElectricMeterFeatureId;

module.exports = EnergyPrice;
