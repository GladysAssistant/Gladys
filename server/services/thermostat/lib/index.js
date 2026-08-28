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
  onExternalSetpointChanged,
  getTargetSelectors,
  getWindowSelectors,
  invalidateDeviceCaches,
  postUpdate,
} = require('./thermostat.onWindowOpen');
const { setValue } = require('./thermostat.setValue');
const { postDelete } = require('./thermostat.postDelete');
const {
  setVariable,
  getVariable,
  getFeatureKeys,
  resolveRuntimeVariableKey,
  broadcastConfigUpdated,
  triggerApplySchedules,
} = require('./thermostat.setVariable');

const ThermostatHandler = function ThermostatHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.applyTimer = null;
  // Derived from this service's devices, rebuilt lazily and dropped whenever a
  // thermostat device is created, updated or deleted.
  this.windowSelectorsCache = null;
  this.featureKeysCache = null;
  this.targetSelectorsCache = null;
  // Setpoints this service just wrote on a real thermostat, by selector. The
  // write comes back as a NEW_STATE, and without this mark that echo would be
  // taken for a change made on the device and arm a manual hold — so a
  // scheduled write would suspend the very schedule that made it.
  this.selfWrittenSetpoints = new Map();
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
ThermostatHandler.prototype.onExternalSetpointChanged = onExternalSetpointChanged;
ThermostatHandler.prototype.getTargetSelectors = getTargetSelectors;
ThermostatHandler.prototype.getWindowSelectors = getWindowSelectors;
ThermostatHandler.prototype.invalidateDeviceCaches = invalidateDeviceCaches;
ThermostatHandler.prototype.postUpdate = postUpdate;
ThermostatHandler.prototype.setValue = setValue;
ThermostatHandler.prototype.postDelete = postDelete;
ThermostatHandler.prototype.setVariable = setVariable;
ThermostatHandler.prototype.getVariable = getVariable;
ThermostatHandler.prototype.getFeatureKeys = getFeatureKeys;
ThermostatHandler.prototype.resolveRuntimeVariableKey = resolveRuntimeVariableKey;
ThermostatHandler.prototype.broadcastConfigUpdated = broadcastConfigUpdated;
ThermostatHandler.prototype.triggerApplySchedules = triggerApplySchedules;

module.exports = ThermostatHandler;
