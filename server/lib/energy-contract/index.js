// Rule-based pricing engine of the energy contracts (docs/specs/energy-contracts.md).
// Pure module: no database, no supplier, no integration. The energy-monitoring
// service and the energy_contract API compile a contract's tariff once and price
// its consumption intervals with it.
const { validateTariff } = require('./tariff.validate');
const { compileTariff, substituteInputs } = require('./tariff.compile');
const { priceIntervals } = require('./tariff.priceIntervals');
const { computeDemandCharges } = require('./tariff.demand');
const { getCurrentPrice, getUnitPriceAt } = require('./tariff.currentPrice');
const { createCalendarLookup } = require('./calendar.lookup');
const constants = require('./tariff.constants');

module.exports = {
  validateTariff,
  compileTariff,
  substituteInputs,
  priceIntervals,
  computeDemandCharges,
  getCurrentPrice,
  getUnitPriceAt,
  createCalendarLookup,
  ...constants,
};
