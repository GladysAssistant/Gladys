const { createDevice } = require('./thermostat.createDevice');
const { getDevices } = require('./thermostat.getDevices');
const { getSchedules } = require('./thermostat.getSchedules');
const { createSchedule } = require('./thermostat.createSchedule');
const { updateSchedule } = require('./thermostat.updateSchedule');
const { deleteSchedule } = require('./thermostat.deleteSchedule');
const { detachSchedule } = require('./thermostat.detachSchedule');
const { applySchedules } = require('./thermostat.applySchedules');
const {
  onDeviceNewState,
  getWindowSelectors,
  invalidateWindowCache,
  postUpdate,
} = require('./thermostat.onWindowOpen');
const { setValue } = require('./thermostat.setValue');
const { postDelete } = require('./thermostat.postDelete');
const {
  setVariable,
  getVariable,
  resolveRuntimeVariableKey,
  broadcastConfigUpdated,
  triggerApplySchedules,
} = require('./thermostat.setVariable');

const ThermostatHandler = function ThermostatHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.applyTimer = null;
  // Window-sensor selectors, rebuilt lazily and dropped whenever a thermostat
  // device is created or deleted.
  this.windowSelectorsCache = null;
};

ThermostatHandler.prototype.createDevice = createDevice;
ThermostatHandler.prototype.getDevices = getDevices;
ThermostatHandler.prototype.getSchedules = getSchedules;
ThermostatHandler.prototype.createSchedule = createSchedule;
ThermostatHandler.prototype.updateSchedule = updateSchedule;
ThermostatHandler.prototype.deleteSchedule = deleteSchedule;
ThermostatHandler.prototype.detachSchedule = detachSchedule;
ThermostatHandler.prototype.applySchedules = applySchedules;
ThermostatHandler.prototype.onDeviceNewState = onDeviceNewState;
ThermostatHandler.prototype.getWindowSelectors = getWindowSelectors;
ThermostatHandler.prototype.invalidateWindowCache = invalidateWindowCache;
ThermostatHandler.prototype.postUpdate = postUpdate;
ThermostatHandler.prototype.setValue = setValue;
ThermostatHandler.prototype.postDelete = postDelete;
ThermostatHandler.prototype.setVariable = setVariable;
ThermostatHandler.prototype.getVariable = getVariable;
ThermostatHandler.prototype.resolveRuntimeVariableKey = resolveRuntimeVariableKey;
ThermostatHandler.prototype.broadcastConfigUpdated = broadcastConfigUpdated;
ThermostatHandler.prototype.triggerApplySchedules = triggerApplySchedules;

module.exports = ThermostatHandler;
