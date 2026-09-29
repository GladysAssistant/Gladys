const { createDevice } = require('./thermostat.createDevice');
const { getDevices } = require('./thermostat.getDevices');
const { getSchedules, getScheduleBySelector } = require('./thermostat.getSchedules');
const { createSchedule } = require('./thermostat.createSchedule');
const { updateSchedule } = require('./thermostat.updateSchedule');
const { deleteSchedule } = require('./thermostat.deleteSchedule');
const { attachScheduleToDevice, detachScheduleFromDevice } = require('./thermostat.scheduleDevice');
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
  getPreset,
  savePreset,
  getManualHold,
  setManualHold,
  clearManualHold,
  broadcastConfigUpdated,
  triggerApplySchedules,
} = require('./thermostat.state');

const ThermostatHandler = function ThermostatHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.applyTimer = null;
  // Derived from this service's devices, rebuilt lazily and dropped whenever a
  // thermostat device is created, updated or deleted.
  this.windowSelectorsCache = null;
  this.targetSelectorsCache = null;
  // The last setpoint this service wrote on each real thermostat, by selector.
  // The write is reported back as a NEW_STATE, and without this mark that report
  // would be taken for a change made on the device and arm a manual hold — so a
  // scheduled write would suspend the very schedule that made it. The mark is
  // kept, not consumed: integrations re-report unchanged values.
  this.selfWrittenSetpoints = new Map();
  // The last setpoint *observed* on each real thermostat, by selector, whatever
  // wrote it. A hold must be armed on a change, and a change is a difference
  // from the previous report — not merely a report whose value is not the last
  // one this service wrote. That distinction only shows after a restart, where
  // `selfWrittenSetpoints` is empty: the integration reconnects, re-reports the
  // setpoint the schedule had already set, and without this map that unchanged
  // value would be taken for someone turning the dial (section D).
  this.observedSetpoints = new Map();
};

ThermostatHandler.prototype.createDevice = createDevice;
ThermostatHandler.prototype.getDevices = getDevices;
ThermostatHandler.prototype.getSchedules = getSchedules;
ThermostatHandler.prototype.getScheduleBySelector = getScheduleBySelector;
ThermostatHandler.prototype.createSchedule = createSchedule;
ThermostatHandler.prototype.updateSchedule = updateSchedule;
ThermostatHandler.prototype.deleteSchedule = deleteSchedule;
ThermostatHandler.prototype.attachScheduleToDevice = attachScheduleToDevice;
ThermostatHandler.prototype.detachScheduleFromDevice = detachScheduleFromDevice;
ThermostatHandler.prototype.applySchedules = applySchedules;
ThermostatHandler.prototype.onDeviceNewState = onDeviceNewState;
ThermostatHandler.prototype.onExternalSetpointChanged = onExternalSetpointChanged;
ThermostatHandler.prototype.getTargetSelectors = getTargetSelectors;
ThermostatHandler.prototype.getWindowSelectors = getWindowSelectors;
ThermostatHandler.prototype.invalidateDeviceCaches = invalidateDeviceCaches;
ThermostatHandler.prototype.postUpdate = postUpdate;
ThermostatHandler.prototype.setValue = setValue;
ThermostatHandler.prototype.postDelete = postDelete;
ThermostatHandler.prototype.getPreset = getPreset;
ThermostatHandler.prototype.savePreset = savePreset;
ThermostatHandler.prototype.getManualHold = getManualHold;
ThermostatHandler.prototype.setManualHold = setManualHold;
ThermostatHandler.prototype.clearManualHold = clearManualHold;
ThermostatHandler.prototype.broadcastConfigUpdated = broadcastConfigUpdated;
ThermostatHandler.prototype.triggerApplySchedules = triggerApplySchedules;

module.exports = ThermostatHandler;
