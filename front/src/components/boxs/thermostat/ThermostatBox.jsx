import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import { WEBSOCKET_MESSAGE_TYPES, DEVICE_FEATURE_UNITS } from '../../../../../server/utils/constants';
import { celsiusToFahrenheit } from '../../../../../server/utils/units';
import {
  DEFAULT_MANUAL_DURATION_MINUTES,
  DEFAULT_PRESET_TEMPS,
  DEFAULT_MIN_TEMP,
  DEFAULT_MAX_TEMP,
  DEFAULT_HYSTERESIS_START
} from '../../../../../server/utils/thermostatConstants';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import style from './style.css';
import { getPresetColor as presetColorForMode } from '../../../utils/thermostatPresetColors';
import CircularGauge from './CircularGauge';
import { angleToTemp as angleToSetpoint, getAngleFromPointer, isAngleInArc } from './gaugeGeometry';
import { fetchSchedule, fetchTimezone, getCurrentSlot, resolvePresetFromSchedule } from './scheduleLookup';
import { loadDeviceConfig } from './deviceConfig';

const PRESET_ICONS = {
  off: 'fe-power',
  frost: 'fe-snowflake',
  away: 'fe-user-x',
  eco: 'fe-feather',
  night: 'fe-moon'
};
// Comfort is the only preset whose icon depends on the mode: it means "the
// temperature you want when you are here", which is a flame when heating and a
// snowflake when cooling. A sun for both read as "warm" even in cooling.
const COMFORT_ICON = { heating: 'fe-flame', cooling: 'fe-snowflake' };
const HEATING_PRESETS = ['off', 'frost', 'away', 'eco', 'night', 'comfort'];
const COOLING_PRESETS = ['off', 'comfort'];
// Sentinel: hold every incoming setpoint, whatever its value
const HOLD_ANY_SETPOINT = Symbol('hold-any-setpoint');

// Parse a value as a finite number with a fallback — unlike `Number(x) || d`, a legitimate 0 is kept
const numOr = (value, fallback) => {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

class ThermostatBox extends Component {
  state = {
    setpoint: null,
    currentTemp: null,
    humidity: null,
    activePreset: null,
    isManualMode: false,
    error: false,
    noConfig: false,
    remoteConfig: null,
    featureMin: null,
    featureMax: null,
    featureUnit: null,
    activeSchedule: null,
    currentSlot: null,
    manualUntil: null,
    isWindowOpen: false,
    // Real state of the actuator, as reported by the switch feature. The widget
    // reflects it rather than recomputing it: hysteresis has a neutral zone where
    // the server holds the current state, and that memory cannot be re-derived
    // from the temperature alone.
    isSwitchOn: null
  };

  svgRef = null;
  timezone = null;
  modeInitialized = false;
  savingPreset = false;
  lastActivePreset = 'comfort';
  expectedSetpoint = null;
  expectedSetpointTimer = null;

  getConfig = () => ({ ...this.props.box, ...(this.state.remoteConfig || {}) });
  getMinTemp = () => {
    // Device feature native min has top priority
    if (this.state.featureMin !== null) return this.state.featureMin;
    const cfg = this.getConfig();
    if (cfg.temp_min !== undefined && cfg.temp_min !== null) return Number(cfg.temp_min);
    return DEFAULT_MIN_TEMP;
  };
  getMaxTemp = () => {
    // Device feature native max has top priority
    if (this.state.featureMax !== null) return this.state.featureMax;
    const cfg = this.getConfig();
    if (cfg.temp_max !== undefined && cfg.temp_max !== null) return Number(cfg.temp_max);
    return DEFAULT_MAX_TEMP;
  };

  // Effective temperature unit: device feature unit takes priority over user preference
  getEffectiveUnit = () => {
    if (this.state.featureUnit) return this.state.featureUnit;
    return (this.props.user && this.props.user.temperature_unit_preference) || DEVICE_FEATURE_UNITS.CELSIUS;
  };

  // Values from the device are in the feature's native unit; only when the feature has
  // no unit (assumed Celsius) and the user prefers Fahrenheit do we convert for display.
  needsFahrenheitConversion = () =>
    !this.state.featureUnit &&
    this.props.user &&
    this.props.user.temperature_unit_preference === DEVICE_FEATURE_UNITS.FAHRENHEIT;

  toDisplayTemp = temp => {
    if (temp === null || temp === undefined) return temp;
    return this.needsFahrenheitConversion() ? celsiusToFahrenheit(temp) : temp;
  };

  // Get the temperature unit symbol
  getTempUnit = () => {
    return this.getEffectiveUnit() === DEVICE_FEATURE_UNITS.FAHRENHEIT ? 'F' : 'C';
  };

  loadConfig = async () => {
    const remoteConfig = await loadDeviceConfig(this.props.httpClient, this.props.box.thermostat_feature);
    if (!remoteConfig) {
      return null;
    }
    await new Promise(resolve => this.setState({ remoteConfig }, resolve));
    return remoteConfig;
  };

  loadMode = async () => {
    const { box } = this.props;
    if (!box.thermostat_feature) return {};
    if (this.savingPreset) return {};
    let activePreset = null;
    let isManualMode = null;

    // Read manual mode first — it determines which source to use for the preset
    const manualModeValue = await this.readThermostatVariable('MANUAL_MODE');
    if (manualModeValue !== null) {
      isManualMode = manualModeValue === 'true';
    }

    const knownPresets = [...HEATING_PRESETS, ...COOLING_PRESETS];

    if (isManualMode !== true && this.getActiveScheduleSelector()) {
      // Schedule is active and not in manual mode: derive preset from current slot directly
      // This avoids stale DB variable values
      activePreset = await this.getScheduledPreset();
      if (!activePreset) {
        // No matching slot right now — fall back to the stored preset
        const storedPreset = await this.readThermostatVariable('PRESET');
        if (storedPreset && knownPresets.includes(storedPreset)) {
          activePreset = storedPreset;
        }
      }
      this.modeInitialized = true;
    } else {
      // No schedule or manual mode: use the stored preset
      const storedPreset = await this.readThermostatVariable('PRESET');
      if (storedPreset) {
        activePreset = knownPresets.includes(storedPreset) ? storedPreset : 'comfort';
        this.modeInitialized = true;
      } else if (!this.modeInitialized) {
        this.modeInitialized = true;
        activePreset = 'comfort';
        await this.savePreset(activePreset);
      }
    }

    return { activePreset, isManualMode };
  };

  // Last non-off preset, so turning the thermostat back on restores what the user
  // had. Stored server-side (not localStorage) so it follows the user across
  // browsers and devices, like every other thermostat runtime state.
  saveLastActivePreset = async preset => {
    if (preset === 'off' || !this.props.box.thermostat_feature) {
      return;
    }
    this.lastActivePreset = preset;
    try {
      await this.saveThermostatVariable('PRESET_FALLBACK', preset);
    } catch (e) {
      console.error('Failed to save last active preset:', e);
    }
  };

  // Read synchronously from the in-memory cache: the pointer/increment handlers
  // need it during the same tick to stay responsive. Refreshed by loadLastActivePreset.
  getLastActivePreset = () => this.lastActivePreset || 'comfort';

  loadLastActivePreset = async () => {
    if (!this.props.box.thermostat_feature) {
      return;
    }
    const storedPreset = await this.readThermostatVariable('PRESET_FALLBACK');
    if (storedPreset) {
      this.lastActivePreset = storedPreset;
    }
  };

  // Thermostat runtime state goes through the service endpoint: it persists the
  // variable in the service's own scope, broadcasts the matching websocket message
  // and triggers a server regulation pass. Reading uses the same scope, so the
  // widget sees exactly the rows the regulation loop writes.
  saveThermostatVariable = async (suffix, value) => {
    const key = this.getFeatureVarKey();
    if (!key) return;
    await this.props.httpClient.post(`/api/v1/service/thermostat/state/THERMOSTAT_${key}_${suffix}`, { value });
  };

  readThermostatVariable = async suffix => {
    const key = this.getFeatureVarKey();
    if (!key) return null;
    try {
      const response = await this.props.httpClient.get(`/api/v1/service/thermostat/state/THERMOSTAT_${key}_${suffix}`);
      return response && response.value !== undefined ? response.value : null;
    } catch (e) {
      // Not set yet, or unreadable: the caller falls back to its default.
      return null;
    }
  };

  savePreset = async preset => {
    this.savingPreset = true;
    try {
      await this.saveThermostatVariable('PRESET', preset);
    } catch (e) {
      console.error('Failed to save preset:', e);
    } finally {
      this.savingPreset = false;
    }
  };

  saveManualMode = async isManual => {
    try {
      await this.saveThermostatVariable('MANUAL_MODE', isManual.toString());
    } catch (e) {
      console.error('Failed to save manual mode:', e);
    }
  };

  // Comfort is amber when heating and blue when cooling, like the arc and the
  // preset icon: an air conditioner labelled in the colour of heat reads wrong.
  getPresetColor = presetKey => {
    const cfg = this.getConfig();
    return presetColorForMode(presetKey, cfg.default_mode);
  };

  getPresets = () => {
    const cfg = this.getConfig();
    const mode = cfg.default_mode || 'heating';
    const keys = mode === 'cooling' ? COOLING_PRESETS : HEATING_PRESETS;
    const allPresets = {
      off: { key: 'off', icon: PRESET_ICONS.off, temp: null },
      frost: { key: 'frost', icon: PRESET_ICONS.frost, temp: numOr(cfg.preset_frost, DEFAULT_PRESET_TEMPS.frost) },
      away: { key: 'away', icon: PRESET_ICONS.away, temp: numOr(cfg.preset_away, DEFAULT_PRESET_TEMPS.away) },
      comfort: {
        key: 'comfort',
        icon: mode === 'cooling' ? COMFORT_ICON.cooling : COMFORT_ICON.heating,
        temp: numOr(cfg.preset_comfort, DEFAULT_PRESET_TEMPS.comfort)
      },
      eco: { key: 'eco', icon: PRESET_ICONS.eco, temp: numOr(cfg.preset_eco, DEFAULT_PRESET_TEMPS.eco) },
      night: { key: 'night', icon: PRESET_ICONS.night, temp: numOr(cfg.preset_night, DEFAULT_PRESET_TEMPS.night) }
    };
    return keys.map(k => allPresets[k]);
  };

  getDeviceData = async () => {
    const { box } = this.props;
    const thermostatFeature = box.thermostat_feature;
    // temperature/humidity/window features come from integration config (remoteConfig), not box props
    const temperatureFeature = (this.state.remoteConfig && this.state.remoteConfig.temperature_feature) || null;
    const humidityFeature = (this.state.remoteConfig && this.state.remoteConfig.humidity_feature) || null;
    const windowFeature = (this.state.remoteConfig && this.state.remoteConfig.window_feature) || null;
    const switchFeature = (this.state.remoteConfig && this.state.remoteConfig.switch_feature) || null;
    if (!thermostatFeature && !temperatureFeature) {
      this.setState({ noConfig: true });
      return;
    }
    // Reset features that have been removed
    const stateUpdate = { noConfig: false, error: false };
    if (!temperatureFeature) stateUpdate.currentTemp = null;
    if (!humidityFeature) stateUpdate.humidity = null;
    if (!windowFeature) stateUpdate.isWindowOpen = false;
    if (!switchFeature) stateUpdate.isSwitchOn = null;
    this.setState(stateUpdate);
    const selectors = [thermostatFeature, temperatureFeature, humidityFeature, windowFeature, switchFeature]
      .filter(Boolean)
      .join(',');
    if (!selectors) return;
    try {
      const devices = await this.props.httpClient.get('/api/v1/device', {
        device_feature_selectors: selectors
      });
      if (devices && devices.length) {
        devices.forEach(device => {
          device.features.forEach(feat => {
            if (feat.selector === thermostatFeature) {
              if (feat.last_value !== null && feat.last_value !== undefined) {
                // During manual mode, keep the manual setpoint
                // Also skip if setpoint was already set from schedule preset (avoid stale DB value)
                if (!this.state.isManualMode && !this._scheduleSetpointSet) {
                  this.setState({ setpoint: feat.last_value });
                }
              }
              this._scheduleSetpointSet = false;
              // Store native feature min/max/unit
              if (feat.min !== undefined && feat.min !== null) this.setState({ featureMin: feat.min });
              if (feat.max !== undefined && feat.max !== null) this.setState({ featureMax: feat.max });
              if (feat.unit) this.setState({ featureUnit: feat.unit });
            }
            if (
              temperatureFeature &&
              feat.selector === temperatureFeature &&
              feat.last_value !== null &&
              feat.last_value !== undefined
            ) {
              this.setState({ currentTemp: feat.last_value });
            }
            if (
              humidityFeature &&
              feat.selector === humidityFeature &&
              feat.last_value !== null &&
              feat.last_value !== undefined
            ) {
              this.setState({ humidity: feat.last_value });
            }
            if (
              windowFeature &&
              feat.selector === windowFeature &&
              feat.last_value !== null &&
              feat.last_value !== undefined
            ) {
              this.setState({ isWindowOpen: feat.last_value === 0 });
            }
            if (
              switchFeature &&
              feat.selector === switchFeature &&
              feat.last_value !== null &&
              feat.last_value !== undefined
            ) {
              this.setState({ isSwitchOn: feat.last_value === 1 });
            }
          });
        });
      }
    } catch (e) {
      console.error(e);
      this.setState({ error: true });
    }
  };

  handleWebsocketMessage = payload => {
    const { box } = this.props;
    const thermostatFeature = box.thermostat_feature;
    const temperatureFeature = (this.state.remoteConfig && this.state.remoteConfig.temperature_feature) || null;
    const humidityFeature = (this.state.remoteConfig && this.state.remoteConfig.humidity_feature) || null;
    if (thermostatFeature && payload.device_feature_selector === thermostatFeature) {
      // Don't overwrite setpoint during manual mode
      if (!this.state.isManualMode) {
        // Just left manual mode: drop the in-flight events carrying the old
        // manual setpoint, and only resume following the device once the value
        // we just applied comes back.
        if (this.expectedSetpoint !== null && this.expectedSetpoint !== undefined) {
          // Held: only the value we applied ourselves lifts the hold. While the
          // target is still unknown (HOLD_ANY_SETPOINT), every value is dropped.
          if (payload.last_value === this.expectedSetpoint) {
            this.releaseSetpointHold();
            this.setState({ setpoint: payload.last_value });
          }
        } else {
          this.setState({ setpoint: payload.last_value });
        }
      }
    }
    if (temperatureFeature && payload.device_feature_selector === temperatureFeature) {
      this.setState({ currentTemp: payload.last_value });
    }
    if (humidityFeature && payload.device_feature_selector === humidityFeature) {
      this.setState({ humidity: payload.last_value });
    }
    const windowFeature = (this.state.remoteConfig && this.state.remoteConfig.window_feature) || null;
    if (windowFeature && payload.device_feature_selector === windowFeature) {
      // The server (onDeviceNewState) cuts the switch; the widget only reflects the state
      this.setState({ isWindowOpen: payload.last_value === 0 });
    }
    const switchFeature = (this.state.remoteConfig && this.state.remoteConfig.switch_feature) || null;
    if (switchFeature && payload.device_feature_selector === switchFeature) {
      this.setState({ isSwitchOn: payload.last_value === 1 });
    }
  };

  handleWebsocketConnected = ({ connected }) => {
    if (!connected) {
      this.wasDisconnected = true;
    } else if (this.wasDisconnected) {
      this.getDeviceData();
      this.wasDisconnected = false;
    }
  };

  getFeatureVarKey = () => {
    const { box } = this.props;
    if (!box.thermostat_feature) return null;
    return box.thermostat_feature.toUpperCase().replace(/-/g, '_');
  };

  // The configuration lives on the device, so the event carries none: it only
  // says "reload it". Reading a copy out of the payload would be a second store
  // that could disagree with the device the regulation loop actually reads.
  handleThermostatConfigUpdated = async () => {
    if (!this.props.box.thermostat_feature) return;
    await this.loadConfig();
    await this.getDeviceData();
    await this.loadSchedule();
  };

  handleThermostatPresetUpdated = payload => {
    const key = this.getFeatureVarKey();
    if (!key || payload.key !== `THERMOSTAT_${key}_PRESET`) return;
    if (this.savingPreset) return;
    // A preset event never clears an active manual override. The server only
    // pushes a preset while manual mode is off (or just expired, in which case
    // MANUAL_MODE_UPDATED arrives too), so clearing the flag here would drop a
    // genuine override — including the one selectPreset is in the middle of
    // setting, whose savePreset fires before saveManualMode.
    if (payload.value) {
      const knownPresets = [...HEATING_PRESETS, ...COOLING_PRESETS];
      const resolvedPreset = knownPresets.includes(payload.value) ? payload.value : 'comfort';
      if (this.state.isManualMode) {
        this.setState({ activePreset: resolvedPreset });
        return;
      }
      const newState = { activePreset: resolvedPreset, isManualMode: false, manualSetpointOverride: false };
      if (resolvedPreset !== 'off') {
        const presets = this.getPresets();
        const preset = presets.find(p => p.key === resolvedPreset);
        if (preset && preset.temp !== null && preset.temp !== undefined) {
          newState.setpoint = preset.temp;
        }
      }
      this.loadSchedule();
      this.setState(newState);
    }
  };

  handleThermostatManualModeUpdated = payload => {
    const key = this.getFeatureVarKey();
    if (!key || payload.key !== `THERMOSTAT_${key}_MANUAL_MODE`) return;
    const isManual = payload.value === 'true';
    if (!isManual && this.state.isManualMode) {
      // Server expired the manual timer — revert UI to schedule.
      // Hold the setpoint first: see cancelManualMode for why.
      this.holdSetpointUntilApplied();
      this.setState({ isManualMode: false, manualUntil: null, manualSetpointOverride: false });
      this.clearManualSetpoint();
      this.applyPlanningPreset();
      this.loadSchedule();
    } else if (isManual !== this.state.isManualMode && !this.savingPreset) {
      this.setState({ isManualMode: isManual });
    }
  };

  getActiveScheduleSelector = () => (this.state.remoteConfig && this.state.remoteConfig.active_schedule) || null;

  getScheduledPreset = async () =>
    resolvePresetFromSchedule(
      this.props.httpClient,
      this.getActiveScheduleSelector(),
      [...HEATING_PRESETS, ...COOLING_PRESETS],
      this.timezone
    );

  // Slots are resolved in the Gladys timezone, like the server does: the browser
  // may sit in another one, and the banner would then name a different slot than
  // the one actually heating the house.
  loadTimezone = async () => {
    this.timezone = await fetchTimezone(this.props.httpClient);
  };

  loadSchedule = async () => {
    const schedule = await fetchSchedule(this.props.httpClient, this.getActiveScheduleSelector());
    this.setState({
      activeSchedule: schedule,
      currentSlot: schedule ? getCurrentSlot(schedule, this.timezone) : null
    });
  };

  saveManualSetpoint = async (setpoint, override = true) => {
    try {
      await this.saveThermostatVariable('MANUAL_SETPOINT', JSON.stringify({ setpoint, override: !!override }));
    } catch (e) {
      /* ignore */
    }
  };

  clearManualSetpoint = () => {
    this.saveManualSetpoint(null, false);
  };

  cancelManualMode = () => {
    this.clearManualSetpoint();
    this.saveManualUntilToDb(0);
    // Hold the setpoint before lowering the manual guard: applyPlanningPreset
    // needs a round-trip to resolve the schedule, and the device event carrying
    // the manual setpoint would otherwise be applied in the meantime.
    this.holdSetpointUntilApplied();
    this.setState({ isManualMode: false, manualUntil: null, manualSetpointOverride: false });
    this.saveManualMode(false);
    this.applyPlanningPreset();
    this.loadSchedule();
  };

  // Ignore incoming device setpoints until the one we are about to apply lands.
  // Passing no value holds every value until applyPlanningPreset knows the target.
  holdSetpointUntilApplied = (value = undefined) => {
    this.expectedSetpoint = value === undefined ? HOLD_ANY_SETPOINT : value;
    if (this.expectedSetpointTimer) {
      clearTimeout(this.expectedSetpointTimer);
    }
    // Safety net: never stay deaf to device updates if that event never lands.
    this.expectedSetpointTimer = setTimeout(() => {
      this.expectedSetpoint = null;
      this.expectedSetpointTimer = null;
    }, 10000);
  };

  applyPlanningPreset = async () => {
    // Called when the manual timer expires or the user cancels manual mode.
    // activePreset still holds whatever was picked by hand, so resolve the preset
    // from the schedule instead of trusting it — otherwise the manual preset
    // would simply be re-applied.
    const schedulePreset = await this.getScheduledPreset();
    const targetPreset = schedulePreset || this.state.activePreset;
    const presets = this.getPresets();
    const preset = presets.find(p => p.key === targetPreset);
    const newState = { activePreset: targetPreset };
    if (preset && preset.temp !== null && preset.temp !== undefined) {
      newState.setpoint = preset.temp;
      // The manual setpoint was saved server-side, so its device state event is
      // still in flight and would land after the manual guard is lifted. Record
      // what we are switching to, and ignore any other value until it arrives.
      this.holdSetpointUntilApplied(preset.temp);
    }
    this.setState(newState);
    if (newState.setpoint !== undefined) {
      this.sendSetpoint(newState.setpoint);
    } else {
      // Nothing to apply (preset "off"): release the hold placed by the caller.
      this.releaseSetpointHold();
    }
  };

  releaseSetpointHold = () => {
    this.expectedSetpoint = null;
    if (this.expectedSetpointTimer) {
      clearTimeout(this.expectedSetpointTimer);
      this.expectedSetpointTimer = null;
    }
  };

  saveManualUntilToDb = async until => {
    try {
      await this.saveThermostatVariable('MANUAL_UNTIL', String(until));
    } catch (e) {
      /* ignore */
    }
  };

  startManualTimer = setpoint => {
    const cfg = this.getConfig();
    // Same fallback the server applies, so the countdown the widget shows matches
    // the expiry the regulation loop enforces.
    const durationMs = numOr(cfg.manual_duration, DEFAULT_MANUAL_DURATION_MINUTES) * 60 * 1000;
    const until = Date.now() + durationMs;
    this.setState({ manualUntil: until });
    this.saveManualSetpoint(setpoint !== undefined ? setpoint : this.state.setpoint);
    // Persist expiry server-side so the server can expire it even when browser is closed
    this.saveManualUntilToDb(until);
  };

  initData = async () => {
    await Promise.all([this.loadConfig(), this.loadLastActivePreset(), this.loadTimezone()]);
    const { activePreset, isManualMode } = await this.loadMode();

    // Build initial state update: apply preset and manual mode atomically,
    // then restore the manual setpoint if it is still active.
    // This must be committed BEFORE getDeviceData() so the setpoint guard works.
    const stateInit = {};
    if (activePreset !== null) stateInit.activePreset = activePreset;
    if (isManualMode !== null) stateInit.isManualMode = isManualMode;

    // If not in manual mode and a preset was resolved, apply its setpoint immediately
    // so the gauge shows the correct temperature without waiting for getDeviceData
    if (!isManualMode && activePreset && activePreset !== 'off') {
      const presets = this.getPresets();
      const presetObj = presets.find(p => p.key === activePreset);
      if (presetObj && presetObj.temp !== null && presetObj.temp !== undefined) {
        stateInit.setpoint = presetObj.temp;
        this._scheduleSetpointSet = true;
      }
    }

    // Restore manual mode state from the server (the single source of truth)
    if (isManualMode === true) {
      // Restore manual until for UI countdown display
      const untilValue = await this.readThermostatVariable('MANUAL_UNTIL');
      if (untilValue) {
        const until = parseInt(untilValue, 10);
        if (until > Date.now()) stateInit.manualUntil = until;
      }
      // Restore manual setpoint
      const setpointValue = await this.readThermostatVariable('MANUAL_SETPOINT');
      if (setpointValue) {
        try {
          const parsed = JSON.parse(setpointValue);
          if (parsed && parsed.setpoint !== null && !isNaN(parsed.setpoint)) {
            stateInit.setpoint = parsed.setpoint;
            if (parsed.override) stateInit.manualSetpointOverride = true;
          }
        } catch (e) {
          /* stored value is not valid JSON, keep the computed setpoint */
        }
      }
    }

    // Commit everything atomically and wait for the state to be applied
    if (Object.keys(stateInit).length > 0) {
      await new Promise(resolve => this.setState(stateInit, resolve));
    }
    await this.getDeviceData();
    await this.loadSchedule();
  };

  // Local minute tick: refresh the current slot from the cached schedule (no HTTP)
  // and clear the manual banner when the timer visually expires.
  refreshClock = () => {
    const { activeSchedule, manualUntil } = this.state;
    if (activeSchedule) {
      this.setState({ currentSlot: getCurrentSlot(activeSchedule, this.timezone) });
    }
    if (manualUntil && Date.now() > manualUntil) {
      this.setState({ manualUntil: null });
    }
  };

  componentDidMount() {
    this.initData();
    this.clockInterval = setInterval(this.refreshClock, 60 * 1000);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE, this.handleWebsocketMessage);
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.CONFIG_UPDATED,
      this.handleThermostatConfigUpdated
    );
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.PRESET_UPDATED,
      this.handleThermostatPresetUpdated
    );
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.MANUAL_MODE_UPDATED,
      this.handleThermostatManualModeUpdated
    );
    this.props.session.dispatcher.addListener('websocket.connected', this.handleWebsocketConnected);
  }

  componentWillUnmount() {
    clearInterval(this.clockInterval);
    // A drag in progress keeps window-level listeners alive: unmounting
    // mid-drag (dashboard edit, tab switch) would leak them.
    this.stopDrag();
    if (this.expectedSetpointTimer) {
      clearTimeout(this.expectedSetpointTimer);
      this.expectedSetpointTimer = null;
    }
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE, this.handleWebsocketMessage);
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.CONFIG_UPDATED,
      this.handleThermostatConfigUpdated
    );
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.PRESET_UPDATED,
      this.handleThermostatPresetUpdated
    );
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.MANUAL_MODE_UPDATED,
      this.handleThermostatManualModeUpdated
    );
    this.props.session.dispatcher.removeListener('websocket.connected', this.handleWebsocketConnected);
  }

  componentDidUpdate(prevProps) {
    const { box } = this.props;
    // thermostat_feature is the only device-referencing field left on the box:
    // every regulation setting, the active schedule included, lives on the device
    // and arrives through loadConfig / CONFIG_UPDATED.
    if (prevProps.box.thermostat_feature !== box.thermostat_feature) {
      // initData is the one ordering that works: the config must be loaded before
      // the mode is derived from it, and the preset/manual values it returns have
      // to be committed. Calling the four loaders side by side raced on all three.
      this.initData();
    }
    // Switch actuation is handled exclusively by the server (applySchedules,
    // triggered every minute and debounced after each variable/setpoint change).
  }

  sendSetpoint = async value => {
    const { box } = this.props;
    if (!box.thermostat_feature) return;
    try {
      await this.props.httpClient.post(`/api/v1/service/thermostat/setpoint/${box.thermostat_feature}`, { value });
    } catch (e) {
      console.error(e);
    }
  };

  angleToTemp = angleDeg => angleToSetpoint(angleDeg, this.getMinTemp(), this.getMaxTemp());

  onPointerDown = e => {
    if (!this.svgRef) return;
    e.preventDefault();
    const angle = getAngleFromPointer(e, this.svgRef);
    if (!isAngleInArc(angle)) return;
    if (this.state.activePreset === 'off') {
      const lastPreset = this.getLastActivePreset();
      this.setState({
        setpoint: this.angleToTemp(angle),
        isDragging: true,
        isManualMode: true,
        activePreset: lastPreset,
        manualSetpointOverride: true
      });
      this.savePreset(lastPreset);
    } else {
      this.setState({
        setpoint: this.angleToTemp(angle),
        isDragging: true,
        isManualMode: true,
        manualSetpointOverride: true
      });
    }
    this.saveManualMode(true);
    let lastDragSetpoint = this.angleToTemp(angle);
    this._onMove = ev => {
      ev.preventDefault();
      const a = getAngleFromPointer(ev, this.svgRef);
      if (isAngleInArc(a)) {
        lastDragSetpoint = this.angleToTemp(a);
        // Only local state during the drag — the server is notified once, on release
        this.setState({ setpoint: lastDragSetpoint });
      }
    };
    this._onUp = () => {
      this.stopDrag();
      this.sendSetpoint(lastDragSetpoint);
      this.saveManualSetpoint(lastDragSetpoint);
      // A manual setpoint only needs a timer when a schedule would otherwise
      // take it over; the active schedule now lives on the device.
      if (this.state.activeSchedule) this.startManualTimer(lastDragSetpoint);
    };
    window.addEventListener('pointermove', this._onMove);
    window.addEventListener('pointerup', this._onUp);
    window.addEventListener('touchmove', this._onMove, { passive: false });
    window.addEventListener('touchend', this._onUp);
  };

  stopDrag = () => {
    if (this._onMove) window.removeEventListener('pointermove', this._onMove);
    if (this._onUp) window.removeEventListener('pointerup', this._onUp);
    if (this._onMove) window.removeEventListener('touchmove', this._onMove);
    if (this._onUp) window.removeEventListener('touchend', this._onUp);
    this.setState({ isDragging: false });
  };

  increment = () => {
    const step = 0.5;
    const newSetpoint = Math.min(this.getMaxTemp(), this.state.setpoint + step);
    if (this.state.activePreset === 'off') {
      const lastPreset = this.getLastActivePreset();
      this.setState({
        setpoint: newSetpoint,
        isManualMode: true,
        activePreset: lastPreset,
        manualSetpointOverride: true
      });
      this.savePreset(lastPreset);
    } else {
      this.setState({ setpoint: newSetpoint, isManualMode: true, manualSetpointOverride: true });
    }
    this.saveManualMode(true);
    this.saveManualSetpoint(newSetpoint);
    this.sendSetpoint(newSetpoint);
    if (this.state.activeSchedule) this.startManualTimer(newSetpoint);
  };

  decrement = () => {
    const step = 0.5;
    const newSetpoint = Math.max(this.getMinTemp(), this.state.setpoint - step);
    if (this.state.activePreset === 'off') {
      const lastPreset = this.getLastActivePreset();
      this.setState({
        setpoint: newSetpoint,
        isManualMode: true,
        activePreset: lastPreset,
        manualSetpointOverride: true
      });
      this.savePreset(lastPreset);
    } else {
      this.setState({ setpoint: newSetpoint, isManualMode: true, manualSetpointOverride: true });
    }
    this.saveManualMode(true);
    this.saveManualSetpoint(newSetpoint);
    this.sendSetpoint(newSetpoint);
    if (this.state.activeSchedule) this.startManualTimer(newSetpoint);
  };

  selectPreset = async preset => {
    this.saveLastActivePreset(this.state.activePreset);
    const hasSchedule = !!this.state.activeSchedule;
    const newManual = hasSchedule;
    const newSetpoint = preset.temp !== null && preset.temp !== undefined ? preset.temp : this.state.setpoint;
    // Selecting a preset clears any manual temp override
    this.setState({
      activePreset: preset.key,
      setpoint: newSetpoint,
      isManualMode: newManual,
      manualSetpointOverride: false
    });
    if (!newManual) this.clearManualSetpoint();
    await this.savePreset(preset.key);
    await this.saveManualMode(newManual);
    if (preset.temp !== null) {
      this.sendSetpoint(preset.temp);
    }
    if (hasSchedule) this.startManualTimer(newSetpoint);
  };

  render(
    props,
    {
      setpoint,
      currentTemp,
      humidity,
      activePreset,
      error,
      noConfig,
      isManualMode,
      currentSlot,
      manualUntil,
      manualSetpointOverride,
      isWindowOpen,
      isSwitchOn,
      activeSchedule
    }
  ) {
    const cfg = this.getConfig();
    const minTemp = this.getMinTemp();
    const maxTemp = this.getMaxTemp();
    const configMode = cfg.default_mode || 'heating';
    const mode = activePreset === 'off' ? 'off' : configMode;
    const presets = this.getPresets();
    const hystStart = numOr(cfg.hysteresis_start, DEFAULT_HYSTERESIS_START);
    const hasCurrent = currentTemp !== null && currentTemp !== undefined;
    // TPI modulates the on-time over a cycle instead of switching on a band, so
    // painting the gauge with the hysteresis thresholds would show the widget
    // idle while the server is actually pulsing the heater. Under TPI the gauge
    // follows the demand: any positive error within the proportional band counts
    // as heating. Cooling always uses hysteresis, TPI included (see the server).
    const isTpi = cfg.control_type === 'tpi' && mode === 'heating';
    // Estimate, used only when no switch is configured to report the truth.
    // Hysteresis has a neutral zone — between setpoint − start and setpoint + stop
    // the server holds whatever the switch was already doing — so temperature
    // alone cannot say whether it is running. The estimate errs towards "off"
    // there, which is why the flame used to disappear while the relay was still
    // closed.
    const estimatedActive = (() => {
      if (!hasCurrent || mode === 'off') {
        return false;
      }
      if (isTpi) {
        return currentTemp < setpoint;
      }
      if (mode === 'heating') {
        return currentTemp < setpoint - hystStart;
      }
      if (mode === 'cooling') {
        return currentTemp > setpoint + hystStart;
      }
      return false;
    })();
    // The switch is the actuator the server drives, so its state is the truth:
    // the flame then matches what the heater is really doing, neutral zone included.
    const isRunning = isSwitchOn !== null ? isSwitchOn : estimatedActive;
    const showActive = !isWindowOpen && mode !== 'off' && isRunning;

    // Convert temperatures for display
    const displaySetpoint = this.toDisplayTemp(setpoint);
    const displayCurrentTemp = this.toDisplayTemp(currentTemp);
    const displayMinTemp = this.toDisplayTemp(minTemp);
    const displayMaxTemp = this.toDisplayTemp(maxTemp);
    const tempUnit = this.getTempUnit();

    return (
      <div class="card">
        {props.box.name && (
          <div class="card-header">
            <h3 class="card-title">{props.box.name}</h3>
          </div>
        )}
        <div class="card-body">
          {error && (
            <div class="alert alert-danger">
              <i class="fe fe-alert-triangle mr-2" />
              <Text id="dashboard.boxes.thermostat.error" />
            </div>
          )}
          {noConfig && (
            <div class="alert alert-warning">
              <i class="fe fe-alert-triangle mr-2" />
              <Text id="dashboard.boxes.thermostat.noConfig" />
            </div>
          )}
          {!error && !noConfig && setpoint !== null && (
            <div>
              <div class="d-flex justify-content-center mb-3">
                <div ref={el => (this.svgRef = el)} class={style.gaugeContainer}>
                  <CircularGauge
                    key={`gauge-${mode}`}
                    setpoint={displaySetpoint}
                    currentTemp={displayCurrentTemp}
                    humidity={humidity}
                    onPointerDown={this.onPointerDown}
                    onIncrement={this.increment}
                    onDecrement={this.decrement}
                    minTemp={displayMinTemp}
                    maxTemp={displayMaxTemp}
                    mode={mode}
                    isActive={showActive}
                    isWindowOpen={isWindowOpen}
                    tempUnit={tempUnit}
                  />
                </div>
              </div>

              {activePreset === null
                ? null
                : (() => {
                    const hasSchedule = !!activeSchedule;
                    if (hasSchedule) {
                      if (isManualMode && manualUntil) {
                        // Manual mode banner: fe-user + Manuel + until time + delete button
                        const untilDate = new Date(manualUntil);
                        const untilTime = `${String(untilDate.getHours()).padStart(2, '0')}:${String(
                          untilDate.getMinutes()
                        ).padStart(2, '0')}`;
                        const t =
                          props.intl && props.intl.dictionary && props.intl.dictionary.dashboard.boxes.thermostat;
                        const manualLabel = (t && t.manualMode) || '';
                        const manualUntilLabel = (t && t.manualUntil) || '';
                        const cancelLabel = (t && t.cancelManual) || '';
                        return (
                          <div class={style.manualBanner}>
                            <i class={`fe fe-user ${style.manualBannerIcon}`} />
                            <span class={style.manualBannerText}>
                              {manualLabel}
                              <span class={style.manualBannerUntil}>
                                {' '}
                                {manualUntilLabel} {untilTime}
                              </span>
                            </span>
                            <button
                              class={style.manualBannerCancel}
                              onClick={this.cancelManualMode}
                              title={cancelLabel}
                            >
                              <i class="fe fe-x" />
                            </button>
                          </div>
                        );
                      }

                      // Planning mode banner: preset icon + name + slot end time
                      const knownPresetKeys = [...HEATING_PRESETS, ...COOLING_PRESETS];
                      const resolvedPresetKey = knownPresetKeys.includes(activePreset) ? activePreset : 'comfort';
                      const activePresetObj =
                        presets.find(p => p.key === resolvedPresetKey) ||
                        presets.find(p => p.key === 'comfort') ||
                        presets[0];
                      const presetIcon = activePresetObj ? activePresetObj.icon : 'fe-power';
                      const i18nPresets =
                        props.intl && props.intl.dictionary && props.intl.dictionary.dashboard.boxes.thermostat.preset;
                      const presetName =
                        i18nPresets && i18nPresets[resolvedPresetKey]
                          ? i18nPresets[resolvedPresetKey]
                          : resolvedPresetKey;
                      const bannerColor = this.getPresetColor(resolvedPresetKey);
                      const t2 =
                        props.intl && props.intl.dictionary && props.intl.dictionary.dashboard.boxes.thermostat;
                      const untilLabel = (t2 && t2.scheduleUntil) || '';

                      return (
                        <div class={style.scheduleBanner} style={`--banner-color:${bannerColor}`}>
                          <i class={`fe ${presetIcon} ${style.scheduleBannerIcon}`} />
                          <span class={style.scheduleBannerText}>
                            {presetName}
                            {currentSlot && currentSlot.end_time && (
                              <span class={style.scheduleBannerUntil}>
                                {' '}
                                {untilLabel} {currentSlot.end_time.substring(0, 5)}
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    }

                    // No schedule: always show full icon bar
                    const resolvedActivePreset = [...HEATING_PRESETS, ...COOLING_PRESETS].includes(activePreset)
                      ? activePreset
                      : 'comfort';
                    return (
                      <div class={style.segmentedControl}>
                        {presets.map(preset => {
                          const presetTitle =
                            props.intl &&
                            props.intl.dictionary &&
                            props.intl.dictionary.dashboard &&
                            props.intl.dictionary.dashboard.boxes &&
                            props.intl.dictionary.dashboard.boxes.thermostat &&
                            props.intl.dictionary.dashboard.boxes.thermostat.preset &&
                            props.intl.dictionary.dashboard.boxes.thermostat.preset[preset.key]
                              ? props.intl.dictionary.dashboard.boxes.thermostat.preset[preset.key]
                              : preset.key;
                          const isActive = resolvedActivePreset === preset.key && !manualSetpointOverride;
                          const presetColor = this.getPresetColor(preset.key);
                          return (
                            <button
                              key={preset.key}
                              class={`${style.segmentBtn} ${isActive ? style.segmentBtnActive : ''}`}
                              style={isActive ? `--preset-color:${presetColor}` : undefined}
                              onClick={() => this.selectPreset(preset)}
                              title={presetTitle}
                            >
                              <i class={`fe ${preset.icon}`} />
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default connect('httpClient,session,user', {})(withIntlAsProp(ThermostatBox));
