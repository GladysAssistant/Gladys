import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import {
  WEBSOCKET_MESSAGE_TYPES,
  DEVICE_FEATURE_UNITS,
  THERMOSTAT_MODE,
  THERMOSTAT_PRESET
} from '../../../../../server/utils/constants';
import { celsiusToFahrenheit, fahrenheitToCelsius } from '../../../../../server/utils/units';
import {
  DEFAULT_PRESET_TEMPS,
  DEFAULT_MIN_TEMP,
  DEFAULT_MAX_TEMP,
  DEFAULT_HYSTERESIS_START
} from '../../../../../server/utils/thermostatConstants';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import style from './style.css';
import { getPresetColor as presetColorForMode, readableTextOn } from '../../../utils/thermostatPresetColors';
import CircularGauge from './CircularGauge';
import { angleToTemp as angleToSetpoint, getAngleFromPointer, isAngleInArc } from './gaugeGeometry';
import { loadDeviceConfig } from './deviceConfig';
import { isRunningFromStateFeature } from './operatingState';

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
// A preset the thermostat can be started back on: one that names a temperature.
const isStartPreset = preset => preset !== 'off' && [...HEATING_PRESETS, ...COOLING_PRESETS].includes(preset);
// The preset feature carries an integer; the widget speaks in names. `off` is in
// neither table: stopping is a mode, and it goes to the mode feature.
const PRESET_VALUES = {
  schedule: THERMOSTAT_PRESET.SCHEDULE,
  frost: THERMOSTAT_PRESET.FROST,
  away: THERMOSTAT_PRESET.AWAY,
  eco: THERMOSTAT_PRESET.ECO,
  night: THERMOSTAT_PRESET.NIGHT,
  comfort: THERMOSTAT_PRESET.COMFORT
};
const PRESET_NAMES = Object.keys(PRESET_VALUES).reduce((acc, name) => ({ ...acc, [PRESET_VALUES[name]]: name }), {});
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
    manualUntil: null,
    isWindowOpen: false,
    // Real state of the actuator, as reported by the switch feature. The widget
    // reflects it rather than recomputing it: hysteresis has a neutral zone where
    // the server holds the current state, and that memory cannot be re-derived
    // from the temperature alone.
    isSwitchOn: null,
    // A mode this card has written and no reload of the device has carried yet
    // (see writeMode). Read before the device's own mode, so a tap on Off or on
    // a way out of it shows at once, and a reload already in flight when the
    // user tapped cannot bring the old mode back.
    pendingMode: null
  };

  svgRef = null;
  timezone = null;
  sensorUnit = null;
  thermostatUnit = null;
  savingPreset = false;
  // True while selectPreset writes: the hold it may arm is the widget's own, so
  // the preset it just lit must not be un-highlighted by the server's echo.
  pickingPreset = false;
  lastActivePreset = null;
  expectedSetpoint = null;
  expectedSetpointTimer = null;

  getConfig = () => ({ ...this.props.box, ...(this.state.remoteConfig || {}) });

  isExternal = () => {
    const cfg = this.getConfig();
    return cfg.thermostat_type === 'external';
  };

  // Which feature tells the widget the equipment is running: the switch Gladys
  // drives on a virtual thermostat, the real device's state feature on an
  // external one. An external thermostat that exposes neither returns null, and
  // the widget estimates the state from the setpoint instead.
  getRunningStateFeature = () => {
    const cfg = this.state.remoteConfig;
    if (!cfg) return null;
    return (this.isExternal() ? cfg.state_feature : cfg.switch_feature) || null;
  };
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

  // The room sensor is a separate device from the thermostat, so it can report a
  // different unit — a Celsius Zigbee probe next to a Fahrenheit thermostat.
  // Everything downstream (the gauge, the "is it heating" hint) works in the
  // thermostat's unit, so the reading is brought into it here. The sensor unit
  // comes from the initial GET; websocket state events do not carry it.
  toThermostatUnit = temp => {
    if (temp === null || temp === undefined) return temp;
    const sensorUnit = this.sensorUnit;
    if (!sensorUnit) return temp;
    // Read from the instance field, not from getEffectiveUnit(): the thermostat
    // unit is stored through setState in the same pass and would still be stale.
    const thermostatUnit =
      this.thermostatUnit ||
      (this.props.user && this.props.user.temperature_unit_preference) ||
      DEVICE_FEATURE_UNITS.CELSIUS;
    if (sensorUnit === thermostatUnit) return temp;
    if (sensorUnit === DEVICE_FEATURE_UNITS.CELSIUS && thermostatUnit === DEVICE_FEATURE_UNITS.FAHRENHEIT) {
      return celsiusToFahrenheit(temp);
    }
    if (sensorUnit === DEVICE_FEATURE_UNITS.FAHRENHEIT && thermostatUnit === DEVICE_FEATURE_UNITS.CELSIUS) {
      return fahrenheitToCelsius(temp);
    }
    return temp;
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
    await new Promise(resolve =>
      this.setState(prev => {
        // The device carries the mode this card wrote: nothing is pending any more.
        // A read that predates the write carries the old mode, and leaves it.
        const confirmed =
          remoteConfig.mode !== null &&
          remoteConfig.mode !== undefined &&
          Number(remoteConfig.mode) === prev.pendingMode;
        return confirmed ? { remoteConfig, pendingMode: null } : { remoteConfig };
      }, resolve)
    );
    return remoteConfig;
  };

  // The preset and the hold both arrive with the device: the preset as the
  // last_value of its feature, the hold as device params. There is nothing to
  // resolve and nothing to fetch — that is what moving them onto the device is
  // for. A thermostat that was never driven carries no preset, and the render
  // already handles that: writing a default here would make merely opening a
  // dashboard start the heating.
  loadMode = () => {
    const cfg = this.state.remoteConfig;
    if (!cfg) {
      return {};
    }
    // A stopped thermostat shows Off, whatever preset it carries underneath:
    // that preset is what it returns to, not what it is doing.
    const activePreset = this.isStopped() ? 'off' : this.followedPreset();
    const hold = this.getHold();
    return { activePreset, isManualMode: !this.isStopped() && !!hold };
  };

  // The preset the thermostat is actually on. `schedule` is not one of them: it
  // says "follow the programme", so what is in force is the programme's current
  // point — which the server sends alongside the schedule, already resolved.
  //
  // Reading it here rather than waiting for the regulation pass is what stops the
  // bar flashing: the pass is debounced by a couple of seconds, and until it ran
  // the widget would fall back on its default and light up Comfort.
  followedPreset = () => {
    const cfg = this.state.remoteConfig;
    const name = cfg ? PRESET_NAMES[cfg.preset] : null;
    if (name !== 'schedule') {
      return name || null;
    }
    const { activeSchedule, activePreset } = this.state;
    if (activeSchedule && activeSchedule.current) {
      return activeSchedule.current.preset;
    }
    // The schedule is not loaded yet, or carries no point. Keeping what is on
    // screen beats blanking it: a null preset hides the banner entirely, and the
    // widget would lose it for the time of a round trip.
    return activePreset || null;
  };

  // Stopped by hand: the machine is off, which outranks the programme. The
  // widget shows Off highlighted and the loop leaves the thermostat alone.
  isStopped = () => {
    const { remoteConfig: cfg, pendingMode } = this.state;
    const mode = pendingMode !== null ? pendingMode : cfg && cfg.mode;
    // A thermostat carries a mode, but it has no value until something writes
    // one, and an older device may predate the feature entirely. `Number(null)`
    // is 0, which is OFF, so the value has to be checked for being there before
    // it is compared: otherwise a thermostat that was never stopped reads as
    // permanently stopped.
    if (!cfg || mode === null || mode === undefined) {
      return false;
    }
    return Number(mode) === THERMOSTAT_MODE.OFF;
  };

  // The mode a running thermostat carries, from what it is configured to do.
  getRunningMode = () =>
    this.getConfig().default_mode === 'cooling' ? THERMOSTAT_MODE.COOLING : THERMOSTAT_MODE.HEATING;

  // Leaving a stop takes a mode write: the regulation loop skips a stopped
  // thermostat, so a setpoint or a preset written alone would be stored and
  // never applied. Every way out of Off goes through here.
  resumeIfStopped = async () => {
    if (!this.isStopped()) {
      return;
    }
    await this.writeMode(this.getRunningMode());
  };

  // The widget's own mode writes come back as a NEW_STATE on the mode feature.
  // Remembering the value lets that echo be told apart from a stop or a start
  // made elsewhere (a scene, the API, a second dashboard), which has to reload
  // the whole card.
  //
  // It comes back twice: the thermostat service saves the state, and so does the
  // core, which saves it itself for a feature without feedback. The value is
  // therefore remembered for a few seconds rather than for one event: the second
  // echo rebuilt the card from a device read taken before the preset and the
  // setpoint written next had landed, and the card ended on neither.
  //
  // The mode is also held as pending from the tap, in the same render as
  // whatever the tap lit: the banner, the gauge and the event handlers read a
  // stop from it, in both directions, and none of them waits for the reload.
  // A failed write lets it go, and the device's mode shows again.
  writeMode = async value => {
    const cfg = this.state.remoteConfig;
    this.expectedMode = value;
    if (this.expectedModeTimer) {
      clearTimeout(this.expectedModeTimer);
    }
    this.expectedModeTimer = setTimeout(this.forgetExpectedMode, 5000);
    this.setState({ pendingMode: value });
    const written = await this.writeFeature(cfg && cfg.modeFeature, value);
    if (!written) {
      // No echo is coming: a stop or a start made elsewhere must not be skipped.
      this.forgetExpectedMode();
      this.setState({ pendingMode: null });
    }
    return written;
  };

  forgetExpectedMode = () => {
    this.expectedMode = null;
    if (this.expectedModeTimer) {
      clearTimeout(this.expectedModeTimer);
      this.expectedModeTimer = null;
    }
  };

  // The manual hold, as the device carries it. `until` is null on a permanent
  // hold, which is what a thermostat following no schedule gets.
  getHold = () => {
    const cfg = this.state.remoteConfig;
    if (!cfg || cfg.manual_setpoint === null || cfg.manual_setpoint === undefined) {
      return null;
    }
    const until = cfg.manual_until && cfg.manual_until > Date.now() ? cfg.manual_until : null;
    return { setpoint: cfg.manual_setpoint, until };
  };

  // Last preset that was not a stop, so turning the thermostat back on restores
  // what the user had. Stopping is a mode now, and a mode leaves the preset
  // feature untouched, so the preset the device carries *is* the fallback —
  // there is nothing left to store on the side.
  saveLastActivePreset = preset => {
    if (isStartPreset(preset)) {
      this.lastActivePreset = preset;
    }
  };

  // Read synchronously: the pointer/increment handlers need it during the same
  // tick to stay responsive. Only a named preset: `schedule` names no
  // temperature to start on, and writing it hands the thermostat back to its
  // programme. A thermostat stopped while following one restarts on Comfort.
  getLastActivePreset = () => {
    const cfg = this.state.remoteConfig;
    const carried = cfg && PRESET_NAMES[cfg.preset];
    return this.lastActivePreset || (isStartPreset(carried) ? carried : null) || 'comfort';
  };

  // Every write goes through the generic feature value route, the one the whole
  // of Gladys already uses: picking a preset is a value on the preset feature,
  // holding a temperature a value on target-temperature, stopping a value on
  // mode. The widget owns no state machine — the server does — so there is
  // nothing here to keep in step with it.
  writeFeature = async (feature, value) => {
    if (!feature) return false;
    try {
      await this.props.httpClient.post(`/api/v1/device_feature/${feature.selector}/value`, { value });
      return true;
    } catch (e) {
      console.error('Failed to write a thermostat feature:', e);
      return false;
    }
  };

  savePreset = async preset => {
    const cfg = this.state.remoteConfig;
    const value = PRESET_VALUES[preset];
    if (!cfg || !cfg.presetFeature || value === undefined) {
      return;
    }
    this.savingPreset = true;
    try {
      await this.writeFeature(cfg.presetFeature, value);
    } finally {
      this.savingPreset = false;
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
    // The running state comes from the switch Gladys drives on a virtual
    // thermostat, and from the real device's state feature on an external one.
    // Both end up in `isSwitchOn`, which is what draws the heating halo.
    const switchFeature = this.getRunningStateFeature();
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
        // Both units must be known before any reading is converted: the two
        // features can arrive in any order, and setState is asynchronous, so
        // resolving them inside the loop would convert the first reading against
        // a stale unit.
        const allFeatures = devices.reduce((acc, device) => acc.concat(device.features || []), []);
        const thermostatUnitFeature = allFeatures.find(feat => feat.selector === thermostatFeature);
        if (thermostatUnitFeature && thermostatUnitFeature.unit) {
          this.thermostatUnit = thermostatUnitFeature.unit;
        }
        const sensorUnitFeature = temperatureFeature
          ? allFeatures.find(feat => feat.selector === temperatureFeature)
          : null;
        this.sensorUnit = (sensorUnitFeature && sensorUnitFeature.unit) || null;

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
              this.setState({ currentTemp: this.toThermostatUnit(feat.last_value) });
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
              this.stateFeature = feat;
              this.setState({ isSwitchOn: isRunningFromStateFeature(feat, feat.last_value) });
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
      // Don't overwrite a setpoint the user is holding here. `isManualMode` is
      // not enough on its own: a scene writing the setpoint puts the device in
      // manual mode too, and its MANUAL_MODE_UPDATED often lands before the
      // NEW_STATE carrying the new value — the guard would then swallow the very
      // event that was supposed to display it, leaving the old setpoint on screen
      // until the next refresh. `manualSetpointOverride` is set only by this
      // widget's own dial and buttons, so it tells the two apart.
      // On an external thermostat the real device is a second source of truth:
      // turning the dial on the Netatmo itself, or a change made in its own app,
      // arrives here as a NEW_STATE and has to be displayed. Holding the local
      // setpoint would leave the widget showing a value the thermostat no longer
      // has. A virtual thermostat has no such second source, so its own manual
      // hold still wins there.
      if (this.isExternal() || !this.state.isManualMode || !this.state.manualSetpointOverride) {
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
      this.setState({ currentTemp: this.toThermostatUnit(payload.last_value) });
    }
    if (humidityFeature && payload.device_feature_selector === humidityFeature) {
      this.setState({ humidity: payload.last_value });
    }
    const windowFeature = (this.state.remoteConfig && this.state.remoteConfig.window_feature) || null;
    if (windowFeature && payload.device_feature_selector === windowFeature) {
      // The server (onDeviceNewState) cuts the switch; the widget only reflects the state
      this.setState({ isWindowOpen: payload.last_value === 0 });
    }
    const modeFeature = this.state.remoteConfig && this.state.remoteConfig.modeFeature;
    if (modeFeature && payload.device_feature_selector === modeFeature.selector) {
      this.handleModeChanged(payload.last_value);
    }
    const switchFeature = this.getRunningStateFeature();
    if (switchFeature && payload.device_feature_selector === switchFeature) {
      // NEW_STATE carries no category/type, so the shape cached from the initial
      // GET /api/v1/device is what the value is normalised against.
      this.setState({ isSwitchOn: isRunningFromStateFeature(this.stateFeature, payload.last_value) });
    }
  };

  // A stop or a start made outside this card changes everything it shows: the
  // gauge, the lit preset, the banner. The card is rebuilt the way a reload
  // builds it, rather than patched. Its own writes are skipped, both echoes of
  // them (see writeMode): the click that made them already put the card in the
  // right state.
  handleModeChanged = value => {
    if (this.expectedMode !== null && this.expectedMode !== undefined && Number(value) === this.expectedMode) {
      return;
    }
    this.setState({ pendingMode: null });
    this.initData();
  };

  handleWebsocketConnected = ({ connected }) => {
    if (!connected) {
      this.wasDisconnected = true;
    } else if (this.wasDisconnected) {
      this.getDeviceData();
      this.wasDisconnected = false;
    }
  };

  // The configuration lives on the device, so the event carries none: it only
  // says "reload it". Reading a copy out of the payload would be a second store
  // that could disagree with the device the regulation loop actually reads.
  handleThermostatConfigUpdated = async () => {
    if (!this.props.box.thermostat_feature) return;
    await this.loadConfig();
    // The schedule before the state that reads it: a thermostat following its
    // programme takes its preset from the point in force.
    await this.loadSchedule();
    const { activePreset, isManualMode } = this.loadMode();
    this.setState({ activePreset, isManualMode });
    await this.getDeviceData();
    this.applyFallbackSetpoint();
  };

  // The server names the thermostat, not a variable key: the preset is a feature
  // of that device now.
  isOurDevice = payload => {
    const cfg = this.state.remoteConfig;
    return !!cfg && !!payload && payload.device === cfg.device_selector;
  };

  handleThermostatPresetUpdated = payload => {
    if (!this.isOurDevice(payload) || this.savingPreset) return;
    // A preset set by a scene or the API on a stopped thermostat is stored, not
    // applied: the loop skips a stopped thermostat. Taking the event as is drew
    // the preset's setpoint and lit its button, as if the heater were running.
    // Reloading the device keeps Off and shows the preset as the one it will
    // start back on.
    if (this.isStopped()) {
      this.refreshFromDevice();
      return;
    }
    const knownPresets = [...HEATING_PRESETS, ...COOLING_PRESETS];
    if (!payload.preset || !knownPresets.includes(payload.preset)) return;
    const resolvedPreset = payload.preset;
    // A preset event never clears an active hold: the server only pushes a preset
    // while none is armed, or just as one expires — in which case the hold event
    // arrives too and does the clearing.
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
  };

  handleThermostatManualModeUpdated = payload => {
    if (!this.isOurDevice(payload)) return;
    // The same preset write also arms a hold, which only takes effect once the
    // thermostat starts again: a stopped one is in no manual mode.
    if (this.isStopped()) return;
    // A hold with no setpoint is a cleared hold.
    const isManual = payload.setpoint !== null && payload.setpoint !== undefined;
    // On an external thermostat this event also announces a setpoint changed on
    // the device itself (its dial, the vendor app, its own programme): the
    // setpoint no longer comes from the preset, so the preset must stop being
    // shown as active. `manualSetpointOverride` is what un-highlights it, and
    // only this widget's own dial and buttons would otherwise set it.
    //
    // This cannot hang off a *change* of isManualMode: without a schedule the
    // hold is permanent, so a thermostat already in manual mode stays in it, and
    // every later change on the device re-emits `true` with nothing to compare.
    // Same rule as on a reload: a hold landing on the active preset's own setpoint
    // is that preset being applied, and the button stays lit. Forcing the override
    // for every external hold — on the grounds that a manual setpoint never comes
    // from a preset on a real device — left a preset picked on a Netatmo dark
    // until the page was reloaded, while the banner read "Manual mode".
    if (
      isManual &&
      !this.savingPreset &&
      !this.pickingPreset &&
      this.isExternal() &&
      !this.holdMatchesPreset(payload.setpoint, this.state.activePreset)
    ) {
      this.setState({ manualSetpointOverride: true });
    }
    if (!isManual && this.state.isManualMode) {
      // The server let the hold expire — the schedule takes the thermostat back.
      // Hold the setpoint first: see cancelManualMode for why.
      this.holdSetpointUntilApplied();
      this.setState({ isManualMode: false, manualUntil: null, manualSetpointOverride: false });
      this.refreshFromDevice();
    } else if (isManual !== this.state.isManualMode && !this.savingPreset) {
      this.setState({ isManualMode: isManual });
    } else if (isManual && payload.until) {
      // The server's expiry always wins over the one shown meanwhile: it is the
      // moment the loop will actually hand the thermostat back. The widget can
      // only guess at a fixed duration, and a hold that runs to the next schedule
      // point ends whenever that point is — which the widget cannot work out
      // without the whole week in the right timezone.
      //
      // This also covers a hold taken with no schedule, which carries no expiry:
      // the banner falls back to the schedule one, which has no cancel button,
      // until the server arms the expiry and sends it here.
      if (payload.until > Date.now()) {
        this.setState({ manualUntil: payload.until });
      }
    }
  };

  // Re-read the device and adopt what it carries. Everything the widget shows is
  // state of the device now, so one reload replaces the handful of round-trips
  // this used to take.
  refreshFromDevice = async () => {
    // The schedule first: a thermostat following it takes its preset from the
    // point in force, which loadMode reads out of it.
    await this.loadSchedule();
    await this.loadConfig();
    const { activePreset, isManualMode } = this.loadMode();
    this.setState({ activePreset, isManualMode });
  };

  // Which schedule a thermostat follows is a relation, so the server is asked
  // rather than a device param read: the schedule that lists this thermostat is
  // the one it follows. It comes back with `current` and `next` already resolved
  // in the Gladys timezone, so the widget never reads a timezone and never
  // recomputes a point — a phone abroad would otherwise name a point other than
  // the one actually heating the house.
  loadSchedule = async () => {
    const cfg = this.state.remoteConfig;
    const deviceSelector = cfg && cfg.device_selector;
    if (!deviceSelector) {
      this.setState({ activeSchedule: null });
      return;
    }
    try {
      const schedules = await this.props.httpClient.get('/api/v1/service/thermostat/schedule');
      const schedule = (schedules || []).find(candidate =>
        (candidate.devices || []).some(device => device.selector === deviceSelector)
      );
      this.setState({ activeSchedule: schedule || null });
    } catch (e) {
      // A schedule deleted behind the widget's back degrades to "no schedule"
      // rather than leaving a stale banner.
      this.setState({ activeSchedule: null });
    }
  };

  // Handing the thermostat back to its programme is a single write: `schedule`
  // on the preset feature. The server clears the hold and regulates on the
  // programme from there — the widget does not have to resolve which preset that
  // is, nor clear anything itself.
  // Hand the thermostat back to its programme, from a hold or from a stop. A
  // stopped thermostat is skipped by the regulation loop, so the mode has to be
  // written back first or the preset would be stored and never applied.
  // Start it again, without touching the preset. `cancelManualMode` hands the
  // thermostat back to its programme, which a thermostat following none does not
  // have: it would store a `schedule` preset nothing can act on.
  //
  // The card is rebuilt the way a reload builds it: the thermostat starts on the
  // preset and the hold it carried while stopped, and only initData works out
  // which button that lights and which banner it shows. Reloading the preset
  // alone left every button dark until the page was reloaded.
  //
  // The mode turns running at the tap (see writeMode), so the preset it starts
  // back on is lit with it: left on Off, the card read as a running thermostat
  // on Off until initData had made its round trips.
  resumeFromStopped = async () => {
    const cfg = this.state.remoteConfig;
    const carried = cfg && PRESET_NAMES[cfg.preset];
    this.setState({ activePreset: isStartPreset(carried) ? carried : null });
    await this.resumeIfStopped();
    await this.initData();
  };

  cancelManualMode = async () => {
    this.holdSetpointUntilApplied();
    // The point in force is what the thermostat follows from the tap on, and the
    // server resolved it already: lit now, with the mode a stop hands back, not
    // once the reload below has landed — until then the card read as a running
    // thermostat still on Off.
    const current = this.state.activeSchedule && this.state.activeSchedule.current;
    this.setState({
      isManualMode: false,
      manualUntil: null,
      manualSetpointOverride: false,
      ...(current ? { activePreset: current.preset } : {})
    });
    await this.resumeIfStopped();
    await this.savePreset('schedule');
    // The schedule first: its `current` point is what the thermostat follows
    // from now on, and loadMode reads it.
    await this.loadSchedule();
    await this.loadConfig();
    const { activePreset } = this.loadMode();
    this.setState({ activePreset });
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

  releaseSetpointHold = () => {
    this.expectedSetpoint = null;
    if (this.expectedSetpointTimer) {
      clearTimeout(this.expectedSetpointTimer);
      this.expectedSetpointTimer = null;
    }
  };

  // The server arms the hold and its expiry; this only fills the countdown while
  // the event that carries the real one is in flight, and only when the device
  // configures a fixed duration — the same figure the server will apply.
  //
  // With no duration configured the hold runs to the schedule's next point
  // instead, which is not a figure the widget can work out: it would need the
  // whole week resolved in the Gladys timezone. Showing +30 min there displayed
  // a time the thermostat never came back at, and replaced it on the next reload.
  // Nothing is shown until the server says when.
  showManualCountdown = () => {
    const cfg = this.getConfig();
    const duration = numOr(cfg.manual_duration, null);
    if (duration === null) {
      return;
    }
    this.setState({ manualUntil: Date.now() + duration * 60 * 1000 });
  };

  // Whether a hold is a preset being applied, rather than a setpoint of its own.
  // A hold alone says nothing: picking a preset arms one exactly as turning the
  // dial does. A hold sitting on the preset's own setpoint *is* that preset and
  // keeps it highlighted; any other value is a setpoint no preset represents —
  // which is what a temperature set on the real thermostat looks like.
  //
  // Extracted because the reload path and the live event have to answer this the
  // same way. They did not: `initData` applied the rule and the websocket handler
  // still forced the override on every external hold, so a preset picked on a
  // Netatmo stayed dark until the page was reloaded.
  holdMatchesPreset = (setpoint, presetKey) => {
    if (setpoint === null || setpoint === undefined || !presetKey) {
      return false;
    }
    return this.getPresets().some(
      candidate => candidate.key === presetKey && candidate.temp !== null && candidate.temp === setpoint
    );
  };

  initData = async () => {
    await this.loadConfig();
    // The schedule before the state that reads it: a thermostat following its
    // programme takes its preset from the point in force, and the banner needs
    // the schedule to exist at all.
    await this.loadSchedule();
    const { activePreset, isManualMode } = this.loadMode();

    // Build initial state update: apply preset and manual mode atomically,
    // then restore the manual setpoint if it is still active.
    // This must be committed BEFORE getDeviceData() so the setpoint guard works.
    // Reset rather than left as they were: initData also rebuilds a card that is
    // already on screen (a stop or a start made elsewhere), and a stale override
    // would keep every preset dark.
    const stateInit = { manualSetpointOverride: false, manualUntil: null };
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

    // The hold came with the device, so there is nothing left to fetch here.
    // A stopped thermostat can carry a hold — a preset written while it was off
    // arms one — but it only takes effect once it starts again. Reading it here
    // marked the setpoint as manual, and Off was no longer lit.
    const hold = this.isStopped() ? null : this.getHold();
    if (hold) {
      stateInit.setpoint = hold.setpoint;
      // Every preset the user picks arms a hold, so a hold alone says nothing
      // about where the setpoint came from. A hold sitting exactly on the
      // preset's own setpoint is that preset being applied — keep it
      // highlighted, or a reload (or a second device, or a wall tablet) would
      // show no active preset at all on a thermostat that plainly has one. A
      // hold on any other value is a setpoint of its own, which no preset
      // represents.
      //
      // This is the rule for an external thermostat too. It used to be skipped
      // there, on the grounds that a manual setpoint never comes from a preset
      // on a real device — but picking a preset in the widget arms a hold there
      // exactly as it does on a virtual one, so no preset ever lit up on a
      // Netatmo. A setpoint genuinely turned on the device lands on a value no
      // preset carries and is still read as manual, which is the case that
      // reasoning was actually about.
      if (!this.holdMatchesPreset(hold.setpoint, activePreset)) {
        stateInit.manualSetpointOverride = true;
      }
      if (hold.until) {
        stateInit.manualUntil = hold.until;
      }
    }

    // Commit everything atomically and wait for the state to be applied
    await new Promise(resolve => this.setState(stateInit, resolve));
    await this.getDeviceData();
    this.applyFallbackSetpoint();
  };

  // A thermostat that has never been driven has no setpoint anywhere: its
  // target-temperature feature was created empty and no PRESET was ever stored.
  // Without this the render finds no error, no missing config and no setpoint,
  // and draws an empty card. Show the gauge on the comfort temperature instead —
  // purely local, nothing is written to the device, so the widget stays a
  // proposal until the user turns the dial or picks a preset.
  applyFallbackSetpoint = () => {
    const { setpoint, noConfig, error } = this.state;
    if (setpoint !== null && setpoint !== undefined) return;
    if (noConfig || error || !this.props.box.thermostat_feature) return;
    const cfg = this.getConfig();
    const comfort = numOr(cfg.preset_comfort, DEFAULT_PRESET_TEMPS.comfort);
    // The comfort preset can sit outside the device's own range, which would
    // put the needle off the arc.
    const fallback = Math.min(this.getMaxTemp(), Math.max(this.getMinTemp(), comfort));
    this.setState({ setpoint: fallback });
  };

  // Local minute tick. The current point is resolved by the server, so this only
  // clears the countdown when it visually expires; the server's own event is
  // what actually ends the hold.
  refreshClock = () => {
    const { manualUntil } = this.state;
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
    // mid-drag (dashboard edit, tab switch) would leak them. The gesture never
    // reached pointer-up, so nothing was persisted and there is nothing to
    // undo — the device keeps whatever mode it had before the drag started.
    this.stopDrag();
    if (this.expectedSetpointTimer) {
      clearTimeout(this.expectedSetpointTimer);
      this.expectedSetpointTimer = null;
    }
    this.forgetExpectedMode();
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

  // The setpoint route treats a write as a manual override, like a scene would.
  // Pass manual: false when writing back the setpoint the schedule dictates —
  // otherwise returning to the schedule immediately re-arms the override it is
  // clearing, and the widget shows the schedule while the database says manual.
  // Writing a temperature is a value on the setpoint feature. The server turns it
  // into a hold, with the expiry the device's own settings say — the widget does
  // not arm anything, and does not have to stay in step with what it armed.
  sendSetpoint = async value => {
    const { box } = this.props;
    if (!box.thermostat_feature) return;
    try {
      await this.props.httpClient.post(`/api/v1/device_feature/${box.thermostat_feature}/value`, { value });
    } catch (e) {
      console.error(e);
    }
  };

  angleToTemp = angleDeg => angleToSetpoint(angleDeg, this.getMinTemp(), this.getMaxTemp());

  onPointerDown = e => {
    if (!this.svgRef) return;
    const angle = getAngleFromPointer(e, this.svgRef);
    if (!isAngleInArc(angle)) return;
    // Only once the press is known to be on the ring: preventing the default
    // beforehand swallowed a touch starting anywhere on the gauge — the middle,
    // where the temperatures are — and a thumb scrolling past a dashboard of
    // thermostats found dead zones instead of the page moving.
    e.preventDefault();
    // Leaving 'off' by dragging the gauge only changes the preset locally here.
    // Writing PRESET now would debounce a regulation pass while MANUAL_MODE is
    // still false, so a drag lasting longer than the debounce — or an unmount
    // before the release — would let the loop apply the preset and start the
    // heater without the user ever having released a setpoint. It is written on
    // release instead, next to MANUAL_MODE and the setpoint.
    // A stop, not a programme point on Off: on that point the drag is a hold like
    // on any other, and the programme takes the thermostat back at its next point.
    const leavingOff = this.isStopped();
    const presetOnRelease = leavingOff ? this.getLastActivePreset() : null;
    // Snapshot of what the drag is about to overwrite locally, so a cancelled
    // gesture can put it back untouched.
    const stateBeforeDrag = {
      setpoint: this.state.setpoint,
      isManualMode: this.state.isManualMode,
      activePreset: this.state.activePreset,
      manualSetpointOverride: this.state.manualSetpointOverride
    };
    this.setState({
      setpoint: this.angleToTemp(angle),
      isDragging: true,
      isManualMode: true,
      manualSetpointOverride: true,
      ...(leavingOff ? { activePreset: presetOnRelease } : {})
    });
    // MANUAL_MODE is written on release, together with the setpoint and the
    // expiry: writing it here would leave the device in manual mode with no
    // MANUAL_UNTIL if the box unmounts mid-drag, and the regulation loop would
    // then hold the switch in its current state indefinitely.
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
    this._onUp = async () => {
      this.stopDrag();
      if (presetOnRelease) {
        await this.startOnPreset(presetOnRelease);
      }
      await this.sendSetpoint(lastDragSetpoint);
      // A hold only expires when a schedule would otherwise take it over.
      if (this.state.activeSchedule) this.showManualCountdown();
    };
    // A drag taken over by the browser (scroll, gesture, window switch) fires
    // cancel and never up. That is an aborted gesture, not a release: committing
    // it would write a setpoint the user never chose — and on a thermostat left
    // on 'off', a finger caught by a wall-tablet scroll would restore the last
    // preset and start the heater. Roll the local state back and persist nothing,
    // exactly like an unmount mid-drag.
    this._onCancel = () => {
      this.stopDrag();
      this.setState(stateBeforeDrag);
    };
    window.addEventListener('pointermove', this._onMove);
    window.addEventListener('pointerup', this._onUp);
    window.addEventListener('touchmove', this._onMove, { passive: false });
    window.addEventListener('touchend', this._onUp);
    window.addEventListener('pointercancel', this._onCancel);
    window.addEventListener('touchcancel', this._onCancel);
  };

  stopDrag = () => {
    if (this._onMove) window.removeEventListener('pointermove', this._onMove);
    if (this._onUp) window.removeEventListener('pointerup', this._onUp);
    if (this._onMove) window.removeEventListener('touchmove', this._onMove);
    if (this._onUp) window.removeEventListener('touchend', this._onUp);
    if (this._onCancel) window.removeEventListener('pointercancel', this._onCancel);
    if (this._onCancel) window.removeEventListener('touchcancel', this._onCancel);
    this._onMove = null;
    this._onUp = null;
    this._onCancel = null;
    this.setState({ isDragging: false });
  };

  increment = () => {
    const step = 0.5;
    this.stepSetpoint(Math.min(this.getMaxTemp(), this.state.setpoint + step));
  };

  decrement = () => {
    const step = 0.5;
    this.stepSetpoint(Math.max(this.getMinTemp(), this.state.setpoint - step));
  };

  // A tap on + or −. On a stopped thermostat it also starts it again, on the
  // preset it was last on, and holds the new setpoint over that preset. On a
  // programme point on Off it is a hold like on any other point: the preset stays
  // `schedule`, and the programme takes the thermostat back at its next point —
  // writing a named preset there took it off its programme for good.
  //
  // Starting from a stop takes three writes, and their order matters: the mode,
  // since the loop skips a stopped thermostat; then the preset; then the
  // setpoint. The preset arms a hold on its own setpoint, so a setpoint sent
  // alongside it could land first and be replaced: the card showed 21.5 °C in
  // manual mode while the server held Comfort's 21 °C. A tap that follows before
  // the preset has landed waits for it too, or its setpoint would be replaced
  // the same way.
  stepSetpoint = async newSetpoint => {
    if (this.isStopped()) {
      const lastPreset = this.getLastActivePreset();
      this.setState({
        setpoint: newSetpoint,
        isManualMode: true,
        activePreset: lastPreset,
        manualSetpointOverride: true
      });
      this.startingFromOff = this.startOnPreset(lastPreset);
    } else {
      this.setState({ setpoint: newSetpoint, isManualMode: true, manualSetpointOverride: true });
    }
    if (this.state.activeSchedule) this.showManualCountdown();
    const startingFromOff = this.startingFromOff;
    if (startingFromOff) {
      await startingFromOff;
      if (this.startingFromOff === startingFromOff) this.startingFromOff = null;
    }
    await this.sendSetpoint(newSetpoint);
  };

  // Leaving a stop from the dial or the + and − buttons: start the thermostat
  // again, then put it back on the preset it was last on. Nothing reloads the card
  // afterwards; the pending mode writeMode holds is what keeps it from reading as
  // stopped, and from ignoring the hold the next writes arm.
  startOnPreset = async preset => {
    await this.resumeIfStopped();
    await this.savePreset(preset);
  };

  // Picking a preset is a single write on the preset feature. The server arms the
  // hold on that preset's setpoint and regulates on it: nothing else to send, and
  // no sequence of writes for the two sides to disagree about.
  //
  // `off` is the exception, because stopping is a mode rather than a preset: it
  // goes to the mode feature instead.
  selectPreset = async preset => {
    this.saveLastActivePreset(this.state.activePreset);
    const hasSchedule = !!this.state.activeSchedule;
    const newSetpoint = preset.temp !== null && preset.temp !== undefined ? preset.temp : this.state.setpoint;
    this.setState({
      activePreset: preset.key,
      setpoint: newSetpoint,
      isManualMode: hasSchedule,
      manualSetpointOverride: false
    });
    // The hold the server arms is the widget's own, so the event it echoes back
    // must not un-highlight the preset that was just picked.
    this.pickingPreset = true;
    try {
      if (preset.key === 'off') {
        // Stopping is a mode, not a preset: it switches the machine off, and the
        // regulation loop then leaves it alone whatever the programme says.
        // External thermostats carry this mode feature too — it is Gladys's own
        // stop, and the server turns it into the real device's stop (its mode
        // when it has one, plus the frost setpoint).
        await this.writeMode(THERMOSTAT_MODE.OFF);
      } else {
        await this.resumeIfStopped();
        await this.savePreset(preset.key);
      }
    } finally {
      this.pickingPreset = false;
    }
    await this.refreshFromDevice();
    if (hasSchedule && preset.key !== 'off') this.showManualCountdown();
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
    // The gauge builds one sentence out of these for screen readers; taken from
    // the dictionary directly because it composes them with live values rather
    // than rendering <Text> nodes.
    const a11yDict = (props.intl && props.intl.dictionary && props.intl.dictionary.dashboard.boxes.thermostat) || {};
    const a11yLabels = {
      setpoint: a11yDict.a11ySetpoint,
      currentTemp: a11yDict.a11yCurrentTemp,
      humidity: a11yDict.a11yHumidity,
      windowOpen: configMode === 'cooling' ? a11yDict.windowOpenCooling : a11yDict.windowOpen,
      // Shown in place of the setpoint when the thermostat is off: the number
      // the gauge would otherwise draw is the frost-protection fallback, not
      // something the user asked for (see the gauge).
      off: (a11yDict.preset && a11yDict.preset.off) || 'Off'
    };
    // Off is what the thermostat does when it is stopped, or on a programme point
    // on Off — unless a setpoint set by hand holds over that point: the loop
    // regulates on the hold until the next point, and the gauge shows it.
    const heldOverOff = activePreset === 'off' && isManualMode && manualSetpointOverride;
    const mode = activePreset === 'off' && !heldOverOff ? 'off' : configMode;
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
      // A never-driven thermostat shows a local comfort setpoint so the card is
      // not empty, but nothing was written and the server regulates nothing.
      // Estimating from that proposal would light the flame against a number the
      // user never chose; only a real switch state may say it is running.
      if (activePreset === null || activePreset === undefined) {
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
        {/* The thermostat's own name when the box was not given one: two
            thermostats side by side on a dashboard were otherwise two identical
            cards with no way to tell which room each drove. */}
        {(props.box.name || cfg.device_name) && (
          <div class="card-header">
            <h3 class="card-title">{props.box.name || cfg.device_name}</h3>
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
                    a11yLabels={a11yLabels}
                  />
                </div>
              </div>

              {isWindowOpen && (
                <div class={style.windowBanner}>
                  {/* An alert glyph, not a window: the icon font has none, and
                      what matters here is that the heating is suspended. */}
                  <i class={`fe fe-alert-triangle ${style.windowBannerIcon}`} />
                  <span class={style.windowBannerText}>
                    {/* The server cuts the switch whatever the mode, so an open
                        window suspends a running air conditioner just as it
                        suspends a heater: the banner has to name the right one. */}
                    <Text
                      id={
                        configMode === 'cooling'
                          ? 'dashboard.boxes.thermostat.windowOpenCooling'
                          : 'dashboard.boxes.thermostat.windowOpen'
                      }
                    />
                  </span>
                </div>
              )}

              {/* A thermostat that has never been driven has no stored preset.
                  Hiding the bar then removed the only way to pick one — the bar
                  is shown with nothing highlighted instead. */}
              {(() => {
                const hasSchedule = !!activeSchedule;
                // The banner says what the thermostat is following; the bar
                // below stays reachable whatever it says. Replacing the bar
                // with the banner meant "I am away for the weekend -> Frost"
                // required detaching the programme on the integration page.
                const banner = (() => {
                  // The window banner above already says what the thermostat
                  // is doing, and it replaces this one.
                  // A stopped thermostat keeps its banner whatever else is
                  // true: the cross in it is the only way to start it again, and
                  // on one following no schedule there was none at all — the
                  // gauge read "Off", no preset was lit, and nothing on the card
                  // turned it back on.
                  if (isWindowOpen || (activePreset !== 'off' && (!hasSchedule || activePreset === null))) {
                    return null;
                  }
                  if (isManualMode && manualUntil) {
                    const untilDate = new Date(manualUntil);
                    const untilTime = `${String(untilDate.getHours()).padStart(2, '0')}:${String(
                      untilDate.getMinutes()
                    ).padStart(2, '0')}`;
                    const t = props.intl && props.intl.dictionary && props.intl.dictionary.dashboard.boxes.thermostat;
                    const manualUntilLabel = (t && t.manualUntil) || '';
                    const cancelLabel = (t && t.cancelManual) || '';
                    // A hold is not always a hand-set temperature: picking a
                    // preset arms one too. Saying "Manual mode" while the
                    // Night button is lit told the user their choice had been
                    // replaced by something else. `manualSetpointOverride` is
                    // exactly the distinction — it is what un-highlights the
                    // preset — so the banner names the preset whenever one is
                    // still highlighted, and keeps "Manual mode" for a
                    // setpoint that no preset carries.
                    const heldPreset =
                      !manualSetpointOverride && [...HEATING_PRESETS, ...COOLING_PRESETS].includes(activePreset)
                        ? presets.find(candidate => candidate.key === activePreset)
                        : null;
                    const i18nHeldPresets =
                      props.intl && props.intl.dictionary && props.intl.dictionary.dashboard.boxes.thermostat.preset;
                    const label = heldPreset
                      ? (i18nHeldPresets && i18nHeldPresets[heldPreset.key]) || heldPreset.key
                      : (t && t.manualMode) || '';
                    return (
                      <div
                        class={cx(style.manualBanner, { [style.manualBannerPreset]: !!heldPreset })}
                        style={heldPreset ? `--banner-color:${this.getPresetColor(heldPreset.key)}` : undefined}
                      >
                        <i class={`fe ${heldPreset ? heldPreset.icon : 'fe-user'} ${style.manualBannerIcon}`} />
                        <span class={style.manualBannerText}>
                          {label}
                          <span class={style.manualBannerUntil}>
                            {' '}
                            {manualUntilLabel} {untilTime}
                          </span>
                        </span>
                        <button class={style.manualBannerCancel} onClick={this.cancelManualMode} title={cancelLabel}>
                          <i class="fe fe-x" />
                        </button>
                      </div>
                    );
                  }

                  // Planning banner: preset icon + name + next transition time
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
                    i18nPresets && i18nPresets[resolvedPresetKey] ? i18nPresets[resolvedPresetKey] : resolvedPresetKey;
                  const bannerColor = this.getPresetColor(resolvedPresetKey);
                  const t2 = props.intl && props.intl.dictionary && props.intl.dictionary.dashboard.boxes.thermostat;
                  const untilLabel = (t2 && t2.scheduleUntil) || '';

                  // A stopped thermostat is not waiting for the next point:
                  // the programme does not start it again, only a mode does.
                  // Announcing an hour here promises a return that will not
                  // happen — and the cross is the only way back to the
                  // programme, since every preset arms a hold instead.
                  //
                  // Stopped is the mode, not the preset: a programme point on
                  // `off` lights Off too, yet the thermostat is following the
                  // programme, and that point ends at the next one like any
                  // other ("Off until 06:30"). Reading it from the preset
                  // offered "Back to the schedule" on a thermostat already
                  // back on it, and the button then did nothing.
                  const stopped = this.isStopped();
                  const exitStoppedLabel = hasSchedule
                    ? (t2 && t2.backToSchedule) || ''
                    : (t2 && t2.resumeFromStopped) || '';

                  return (
                    <div class={style.scheduleBanner} style={`--banner-color:${bannerColor}`}>
                      <i class={`fe ${presetIcon} ${style.scheduleBannerIcon}`} />
                      {/* A stopped thermostat already says so in the middle of
                              the gauge, in the largest text on the card, and again
                              under the Off button. Repeating the word a third time
                              here said nothing the user had not read twice — but
                              the banner still has to appear, because its cross is
                              the only way back to the programme. */}
                      <span class={style.scheduleBannerText}>
                        {stopped ? exitStoppedLabel : presetName}
                        {!stopped && activeSchedule && activeSchedule.next && (
                          <span class={style.scheduleBannerUntil}>
                            {' '}
                            {untilLabel} {activeSchedule.next.time}
                          </span>
                        )}
                      </span>
                      {stopped && (
                        <button
                          class={style.manualBannerCancel}
                          onClick={hasSchedule ? this.cancelManualMode : this.resumeFromStopped}
                          title={exitStoppedLabel}
                        >
                          {/* A cross reads as "dismiss": this one starts the
                              thermostat, so it carries the play glyph. */}
                          <i class="fe fe-play" />
                        </button>
                      )}
                    </div>
                  );
                })();

                // A null preset means the user has not chosen one yet, so
                // nothing is highlighted — falling back to 'comfort' would
                // claim a setting that was never made, and the widget writes
                // none until it is clicked.
                const resolvedActivePreset = [...HEATING_PRESETS, ...COOLING_PRESETS].includes(activePreset)
                  ? activePreset
                  : null;
                // Stopping is a mode, and a mode leaves the preset feature alone:
                // a preset set by a scene on a stopped thermostat is stored, and
                // is what it will run on when it starts again. Nothing said so —
                // no button was lit — so the scene looked as though it had done
                // nothing. Shown dimmed: the shape says which preset, the dimming
                // says the machine is not running it yet.
                // The dimming says it visually; this says it in words, for a
                // screen reader and for a hover.
                const pendingTitle = label => {
                  const template =
                    props.intl &&
                    props.intl.dictionary &&
                    props.intl.dictionary.dashboard.boxes.thermostat.presetPending;
                  return template ? template.replace('{{preset}}', label) : label;
                };
                const storedPreset = this.state.remoteConfig && PRESET_NAMES[this.state.remoteConfig.preset];
                const pendingPreset =
                  activePreset === 'off' &&
                  storedPreset !== 'off' &&
                  [...HEATING_PRESETS, ...COOLING_PRESETS].includes(storedPreset)
                    ? storedPreset
                    : null;
                return (
                  <div>
                    {banner}
                    {/* Dimmed rather than removed while a window is open: the
                            bar used to disappear, and the card lost 56px of height
                            — every widget beside it on the dashboard shifted, and
                            came back when the window was shut. */}
                    <div
                      class={cx(style.segmentedControl, { [style.segmentedControlDisabled]: isWindowOpen })}
                      aria-disabled={isWindowOpen ? 'true' : undefined}
                    >
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
                        const isPending = pendingPreset === preset.key;
                        const presetColor = this.getPresetColor(preset.key);
                        return (
                          <button
                            key={preset.key}
                            class={cx(style.segmentBtn, {
                              [style.segmentBtnActive]: isActive,
                              [style.segmentBtnPending]: isPending,
                              [style.segmentBtnOff]: preset.key === 'off'
                            })}
                            style={
                              isActive || isPending
                                ? `--preset-color:${presetColor};--preset-text:${readableTextOn(presetColor)}`
                                : undefined
                            }
                            onClick={() => this.selectPreset(preset)}
                            title={isPending ? pendingTitle(presetTitle) : presetTitle}
                            aria-pressed={isActive ? 'true' : 'false'}
                            disabled={isWindowOpen}
                          >
                            <i class={`fe ${preset.icon}`} />
                            {/* The name under the icon: `title` only shows on
                                    hover, so on a wall tablet the bar was six
                                    unlabelled pictograms. */}
                            <span class={style.segmentBtnLabel}>{presetTitle}</span>
                          </button>
                        );
                      })}
                    </div>
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
