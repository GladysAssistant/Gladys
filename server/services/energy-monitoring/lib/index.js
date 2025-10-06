const { init } = require('./energy-monitoring.init');
const { calculateCostEveryThirtyMinutes } = require('./energy-monitoring.calculateCostEveryThirtyMinutes');
const { calculateCostFrom } = require('./energy-monitoring.calculateCostFrom');
const { calculateCostFromBeginning } = require('./energy-monitoring.calculateCostFromBeginning');
const { getContracts } = require('./energy-monitoring.getContracts');
const { calculateConsumptionFromIndex } = require('./energy-monitoring.calculateConsumptionFromIndex');
const {
  calculateConsumptionFromIndexFromBeginning: ccFromIndexFromBeginning,
} = require('./energy-monitoring.calculateConsumptionFromIndexFromBeginning');

const { JOB_TYPES } = require('../../../utils/constants');

const EnergyMonitoringHandler = function EnergyMonitoringHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.calculateCostEveryThirtyMinutes = this.gladys.job.wrapper(
    JOB_TYPES.ENERGY_MONITORING_COST_CALCULATION_THIRTY_MINUTES,
    this.calculateCostEveryThirtyMinutes.bind(this),
  );
  this.calculateCostFromBeginning = this.gladys.job.wrapper(
    JOB_TYPES.ENERGY_MONITORING_COST_CALCULATION_BEGINNING,
    this.calculateCostFromBeginning.bind(this),
  );
  this.calculateConsumptionFromIndex = this.gladys.job.wrapper(
    JOB_TYPES.ENERGY_MONITORING_CONSUMPTION_FROM_INDEX,
    this.calculateConsumptionFromIndex.bind(this),
  );
  this.calculateConsumptionFromIndexFromBeginning = this.gladys.job.wrapper(
    JOB_TYPES.ENERGY_MONITORING_CONSUMPTION_FROM_INDEX_BEGINNING,
    this.calculateConsumptionFromIndexFromBeginning.bind(this),
  );
};

EnergyMonitoringHandler.prototype.init = init;
EnergyMonitoringHandler.prototype.calculateCostEveryThirtyMinutes = calculateCostEveryThirtyMinutes;
EnergyMonitoringHandler.prototype.calculateCostFrom = calculateCostFrom;
EnergyMonitoringHandler.prototype.calculateCostFromBeginning = calculateCostFromBeginning;
EnergyMonitoringHandler.prototype.getContracts = getContracts;
EnergyMonitoringHandler.prototype.calculateConsumptionFromIndex = calculateConsumptionFromIndex;
EnergyMonitoringHandler.prototype.calculateConsumptionFromIndexFromBeginning = ccFromIndexFromBeginning;

module.exports = EnergyMonitoringHandler;
