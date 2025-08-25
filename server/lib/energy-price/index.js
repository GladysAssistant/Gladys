const { get } = require('./price.get');
const { create } = require('./price.create');
const { update } = require('./price.update');
const { destroy } = require('./price.destroy');

const EnergyPrice = function EnergyPrice() {};

EnergyPrice.prototype.get = get;
EnergyPrice.prototype.create = create;
EnergyPrice.prototype.update = update;
EnergyPrice.prototype.destroy = destroy;

module.exports = EnergyPrice;
