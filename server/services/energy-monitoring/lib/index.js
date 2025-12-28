const queue = require('queue');

const { init } = require('./energy-monitoring.init');
const {
  calculateCostEveryThirtyMinutes,
  buildCostThirtyMinutesJobData,
} = require('./energy-monitoring.calculateCostEveryThirtyMinutes');
const { calculateCostFrom } = require('./energy-monitoring.calculateCostFrom');
const {
  calculateCostFromYesterday,
  buildCostYesterdayJobData,
} = require('./energy-monitoring.calculateCostFromYesterday');
const { calculateCostFromBeginning } = require('./energy-monitoring.calculateCostFromBeginning');
const { calculateCostRange } = require('./energy-monitoring.calculateCostRange');
const { getContracts } = require('./energy-monitoring.getContracts');
const { calculateConsumptionFromIndex } = require('./energy-monitoring.calculateConsumptionFromIndex');
const {
  calculateConsumptionFromIndexFromBeginning: ccFromIndexFromBeginning,
} = require('./energy-monitoring.calculateConsumptionFromIndexFromBeginning');
const {
  calculateConsumptionFromIndexRange: ccFromIndexRange,
} = require('./energy-monitoring.calculateConsumptionFromIndexRange');
const {
  calculateConsumptionFromIndexThirtyMinutes: ccConsumptionFromIndexThirtyMinutes,
  buildConsumptionThirtyMinutesJobData,
} = require('./energy-monitoring.calculateConsumptionFromIndexThirtyMinutes');
const { buildJobDataForConsumption, buildJobDataForCost } = require('./energy-monitoring.jobData');

const { JOB_TYPES } = require('../../../utils/constants');

const EnergyMonitoringHandler = function EnergyMonitoringHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  // @ts-ignore
  this.queue = queue({
    autostart: true,
    concurrency: 1,
  });
  this.calculateCostEveryThirtyMinutes = this.gladys.job.wrapper(
    JOB_TYPES.ENERGY_MONITORING_COST_CALCULATION_THIRTY_MINUTES,
    this.calculateCostEveryThirtyMinutes.bind(this),
    { buildJobData: buildCostThirtyMinutesJobData.bind(this) },
  );
  this.calculateCostFromYesterday = this.gladys.job.wrapper(
    JOB_TYPES.ENERGY_MONITORING_COST_CALCULATION_YESTERDAY,
    this.calculateCostFromYesterday.bind(this),
    { buildJobData: buildCostYesterdayJobData.bind(this) },
  );
  this.calculateCostFromBeginning = this.gladys.job.wrapperDetached(
    JOB_TYPES.ENERGY_MONITORING_COST_CALCULATION_BEGINNING,
    this.calculateCostFromBeginning.bind(this),
    { buildJobData: this.buildJobDataForCost.bind(this) },
  );
  this.calculateCostRange = this.gladys.job.wrapperDetached(
    JOB_TYPES.ENERGY_MONITORING_COST_CALCULATION_RANGE,
    this.calculateCostRange.bind(this),
    { buildJobData: this.buildJobDataForCost.bind(this) },
  );
  this.calculateConsumptionFromIndexThirtyMinutes = this.gladys.job.wrapper(
    JOB_TYPES.ENERGY_MONITORING_CONSUMPTION_FROM_INDEX_THIRTY_MINUTES,
    this.calculateConsumptionFromIndexThirtyMinutes.bind(this),
    { buildJobData: buildConsumptionThirtyMinutesJobData.bind(this) },
  );
  this.calculateConsumptionFromIndexFromBeginning = this.gladys.job.wrapperDetached(
    JOB_TYPES.ENERGY_MONITORING_CONSUMPTION_FROM_INDEX_BEGINNING,
    this.calculateConsumptionFromIndexFromBeginning.bind(this),
    { buildJobData: this.buildJobDataForConsumption.bind(this) },
  );
  this.calculateConsumptionFromIndexRange = this.gladys.job.wrapperDetached(
    JOB_TYPES.ENERGY_MONITORING_CONSUMPTION_FROM_INDEX_RANGE,
    this.calculateConsumptionFromIndexRange.bind(this),
    { buildJobData: this.buildJobDataForConsumption.bind(this) },
  );
};

EnergyMonitoringHandler.prototype.init = init;
EnergyMonitoringHandler.prototype.calculateCostEveryThirtyMinutes = calculateCostEveryThirtyMinutes;
EnergyMonitoringHandler.prototype.calculateCostFrom = calculateCostFrom;
EnergyMonitoringHandler.prototype.calculateCostFromYesterday = calculateCostFromYesterday;
EnergyMonitoringHandler.prototype.calculateCostFromBeginning = calculateCostFromBeginning;
EnergyMonitoringHandler.prototype.calculateCostRange = calculateCostRange;
EnergyMonitoringHandler.prototype.getContracts = getContracts;
EnergyMonitoringHandler.prototype.calculateConsumptionFromIndex = calculateConsumptionFromIndex;
EnergyMonitoringHandler.prototype.calculateConsumptionFromIndexFromBeginning = ccFromIndexFromBeginning;
EnergyMonitoringHandler.prototype.calculateConsumptionFromIndexRange = ccFromIndexRange;
EnergyMonitoringHandler.prototype.calculateConsumptionFromIndexThirtyMinutes = ccConsumptionFromIndexThirtyMinutes;
EnergyMonitoringHandler.prototype.buildJobDataForConsumption = buildJobDataForConsumption;
EnergyMonitoringHandler.prototype.buildJobDataForCost = buildJobDataForCost;

module.exports = EnergyMonitoringHandler;
