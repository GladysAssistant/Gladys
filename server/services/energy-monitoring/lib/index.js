const { init } = require('./energy-monitoring.init');
const { calculateCostEveryThirtyMinutes } = require('./energy-monitoring.calculateCostEveryThirtyMinutes');
const { calculateCostFrom } = require('./energy-monitoring.calculateCostFrom');

const { JOB_TYPES } = require('../../../utils/constants');

const EnergyMonitoringHandler = function EnergyMonitoringHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.calculateCostEveryThirtyMinutes = this.gladys.job.wrapper(
    JOB_TYPES.ENERGY_MONITORING_COST_CALCULATION_THIRTY_MINUTES,
    this.calculateCostEveryThirtyMinutes.bind(this),
  );
};

EnergyMonitoringHandler.prototype.init = init;
EnergyMonitoringHandler.prototype.calculateCostEveryThirtyMinutes = calculateCostEveryThirtyMinutes;
EnergyMonitoringHandler.prototype.calculateCostFrom = calculateCostFrom;

module.exports = EnergyMonitoringHandler;
