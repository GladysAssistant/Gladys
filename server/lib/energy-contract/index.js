// Energy contracts manager (docs/specs/energy-contracts.md): the contract object, the
// tariff calendars, the templates and the pricing of a meter's intervals through the
// rule engine of ./engine.js (or the integration in delegated mode). The engine stays
// pure; everything touching the database, the meters or the integrations is here.
const { get, getBySelector, getActive } = require('./contract.get');
const { create, requestRecalculation } = require('./contract.create');
const { update } = require('./contract.update');
const { destroy } = require('./contract.destroy');
const { getStatus } = require('./contract.getStatus');
const { preview } = require('./contract.preview');
const { getCurrent } = require('./contract.getCurrent');
const { priceContractIntervals, getCompiledTariff } = require('./contract.price');
const { getDefaultElectricMeterFeatureId } = require('./contract.getDefaultElectricMeterFeatureId');
const { getMeterConsumptionFeature, getMeterIntervals, getMeterCumulative } = require('./meter.intervals');
const { declareCalendar, releaseCalendars } = require('./calendar.declare');
const { publishCalendarEntries, requestCalendarRecalculation } = require('./calendar.publish');
const {
  getCalendars,
  getCalendar,
  getCalendarEntries,
  loadCalendarLookup,
  purgeCalendarEntries,
} = require('./calendar.get');
const { getCatalogue, getCommunityTemplates } = require('./template.catalogue');
const { getTemplates, getTemplate, getIntegrationTemplates, getInternalTemplates } = require('./template.get');
const { getLegacyPrices } = require('./energyPrice.project');
const { migrateFromEnergyPrice, verifyMigratedContract } = require('./migration.fromEnergyPrice');
const { init } = require('./contract.init');

/**
 * @description Energy contracts manager.
 * @param {object} event - Event manager (recalculation requests to the energy-monitoring service).
 * @param {object} stateManager - State manager (meters, internal services).
 * @param {object} serviceManager - Service manager (internal providers).
 * @param {object} device - Device manager (stored consumption states).
 * @param {object} variable - Variable manager (system timezone, migration marker).
 * @example
 * const energyContract = new EnergyContract(event, stateManager, service, device, variable);
 */
const EnergyContract = function EnergyContract(event, stateManager, serviceManager, device, variable) {
  this.event = event;
  this.stateManager = stateManager;
  this.serviceManager = serviceManager;
  this.device = device;
  this.variable = variable;
  // attached after construction by lib/index.js (delegated pricing, section 3 of the capability file)
  this.externalIntegration = null;
  this.compiledTariffs = new Map();
  this.currentPriceCache = new Map();
  this.calendarRecalculations = new Map();
  this.catalogueCache = null;
};

EnergyContract.prototype.init = init;
EnergyContract.prototype.get = get;
EnergyContract.prototype.getBySelector = getBySelector;
EnergyContract.prototype.getActive = getActive;
EnergyContract.prototype.getStatus = getStatus;
EnergyContract.prototype.create = create;
EnergyContract.prototype.update = update;
EnergyContract.prototype.destroy = destroy;
EnergyContract.prototype.requestRecalculation = requestRecalculation;
EnergyContract.prototype.preview = preview;
EnergyContract.prototype.getCurrent = getCurrent;
EnergyContract.prototype.priceContractIntervals = priceContractIntervals;
EnergyContract.prototype.getCompiledTariff = getCompiledTariff;
EnergyContract.prototype.getDefaultElectricMeterFeatureId = getDefaultElectricMeterFeatureId;
EnergyContract.prototype.getMeterConsumptionFeature = getMeterConsumptionFeature;
EnergyContract.prototype.getMeterIntervals = getMeterIntervals;
EnergyContract.prototype.getMeterCumulative = getMeterCumulative;
EnergyContract.prototype.declareCalendar = declareCalendar;
EnergyContract.prototype.releaseCalendars = releaseCalendars;
EnergyContract.prototype.publishCalendarEntries = publishCalendarEntries;
EnergyContract.prototype.requestCalendarRecalculation = requestCalendarRecalculation;
EnergyContract.prototype.getCalendars = getCalendars;
EnergyContract.prototype.getCalendar = getCalendar;
EnergyContract.prototype.getCalendarEntries = getCalendarEntries;
EnergyContract.prototype.loadCalendarLookup = loadCalendarLookup;
EnergyContract.prototype.purgeCalendarEntries = purgeCalendarEntries;
EnergyContract.prototype.getCatalogue = getCatalogue;
EnergyContract.prototype.getCommunityTemplates = getCommunityTemplates;
EnergyContract.prototype.getTemplates = getTemplates;
EnergyContract.prototype.getTemplate = getTemplate;
EnergyContract.prototype.getIntegrationTemplates = getIntegrationTemplates;
EnergyContract.prototype.getInternalTemplates = getInternalTemplates;
EnergyContract.prototype.getLegacyPrices = getLegacyPrices;
EnergyContract.prototype.migrateFromEnergyPrice = migrateFromEnergyPrice;
EnergyContract.prototype.verifyMigratedContract = verifyMigratedContract;

module.exports = EnergyContract;
