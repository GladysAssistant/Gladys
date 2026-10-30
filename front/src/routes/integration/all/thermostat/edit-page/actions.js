import { RequestStatus } from '../../../../../utils/consts';
import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  PILOT_WIRE_MODE
} from '../../../../../../../server/utils/constants';
import {
  DEFAULT_PILOT_WIRE_ORDERS,
  MAX_WINDOW_DELAY_SECONDS,
  DEFAULT_PRESENCE_DELAY_MINUTES,
  MIN_PRESENCE_DELAY_MINUTES,
  MAX_PRESENCE_DELAY_MINUTES,
  DEFAULT_PRESENCE_PRESET,
  PRESENCE_PRESETS,
  defaultPresetTemps
} from '../../../../../../../server/utils/thermostatConstants';
import { route } from 'preact-router';
import createActionsHouse from '../../../../../actions/house';
import { parseSelectorList, serializeSelectorList } from '../../../../../../../server/utils/thermostatSelectorList';

const PILOT_WIRE_ORDERS = Object.values(PILOT_WIRE_MODE);
const PILOT_WIRE_ORDER_PARAM = preset => `THERMOSTAT_PILOT_WIRE_ORDER_${preset.toUpperCase()}`;

// The order each preset sends, as the server reads it: the param when it names
// one of the six orders, the default otherwise.
const readPilotWireOrders = getParam =>
  Object.keys(DEFAULT_PILOT_WIRE_ORDERS).reduce((orders, preset) => {
    const value = parseInt(getParam(PILOT_WIRE_ORDER_PARAM(preset)), 10);
    return { ...orders, [preset]: PILOT_WIRE_ORDERS.includes(value) ? value : DEFAULT_PILOT_WIRE_ORDERS[preset] };
  }, {});

const TEMPERATURE_CATEGORIES = [DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR];
const HUMIDITY_CATEGORIES = [DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR];
const SWITCH_CATEGORIES = [DEVICE_FEATURE_CATEGORIES.SWITCH];
const OPENING_CATEGORIES = [DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR];
// Someone in the room (spec A.4): a motion or a presence sensor reporting a
// state, 1 for someone and 0 for nobody. The `push` variants only say that
// something happened, never that it stopped, so they could not tell an empty room.
const isPresenceFeature = feature =>
  (feature.category === DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR ||
    feature.category === DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR) &&
  feature.type === DEVICE_FEATURE_TYPES.SENSOR.BINARY;
// The setpoint, mode and power an external thermostat is driven through. A heat
// pump or an air conditioner publishes them in the air-conditioning category,
// not in the thermostat one (spec A.0.3).
const AC = DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING;
const isTargetFeature = feature =>
  (feature.category === DEVICE_FEATURE_CATEGORIES.THERMOSTAT &&
    feature.type === DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE) ||
  (feature.category === AC && feature.type === DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE);
const isModeFeature = feature =>
  (feature.category === DEVICE_FEATURE_CATEGORIES.THERMOSTAT &&
    feature.type === DEVICE_FEATURE_TYPES.THERMOSTAT.MODE) ||
  (feature.category === AC && feature.type === DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE);
// The preset fields of the form, with the preset each one sets.
const PRESET_FIELDS = [
  ['thermostatEditPresetFrost', 'frost'],
  ['thermostatEditPresetAway', 'away'],
  ['thermostatEditPresetEco', 'eco'],
  ['thermostatEditPresetNight', 'night'],
  ['thermostatEditPresetComfort', 'comfort']
];
// Switching the use carries the presets along while they still hold the
// previous use's defaults: an air conditioner set up from a blank form kept
// Comfort at 21 °C. A temperature someone typed is theirs, and stays.
const carriedPresets = (state, previous, mode) => {
  const update = {};
  if (previous !== mode) {
    const fahrenheit = state.thermostatEditTempUnit === 'F';
    const inUnit = celsius => (fahrenheit ? Math.round(((celsius * 9) / 5 + 32) * 2) / 2 : celsius);
    const from = defaultPresetTemps(previous);
    const to = defaultPresetTemps(mode);
    PRESET_FIELDS.forEach(([field, preset]) => {
      if (parseFloat(state[field]) === inUnit(from[preset])) {
        update[field] = String(inUnit(to[preset]));
      }
    });
  }
  return update;
};
const isPowerFeature = feature =>
  (feature.category === AC && feature.type === DEVICE_FEATURE_TYPES.AIR_CONDITIONING.BINARY) ||
  (SWITCH_CATEGORIES.includes(feature.category) && feature.type === DEVICE_FEATURE_TYPES.SWITCH.BINARY);

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const actions = {
    async getSchedules(state) {
      try {
        const schedules = await state.httpClient.get('/api/v1/service/thermostat/schedule');
        store.setState({ thermostatSchedules: schedules });
      } catch (e) {
        store.setState({ thermostatSchedules: [] });
      }
    },

    async getDevicesForThermostatEdit(state) {
      try {
        const devices = await state.httpClient.get('/api/v1/device');
        const temperatureFeatures = [];
        const humidityFeatures = [];
        const switchFeatures = [];
        const openingFeatures = [];
        const presenceFeatures = [];
        const pilotWireFeatures = [];
        const targetFeatures = [];
        const stateFeatures = [];
        const modeFeatures = [];
        const powerFeatures = [];
        devices.forEach(device => {
          // A thermostat this integration created is not a real thermostat to
          // drive: pointing an external thermostat at one would make Gladys
          // write its own setpoint back to itself.
          const isOwnThermostat = device.service && device.service.name === 'thermostat';
          device.features.forEach(feature => {
            // min/max come along: a real thermostat advertises the range it
            // accepts (Netatmo 5-30, Zigbee 5-40), and picking it as the setpoint
            // feature adopts those bounds rather than leaving the 5-35 default,
            // which promised a setpoint the device would refuse or clamp.
            // The room narrows each picker to the thermostat's own room (spec A.3);
            // the device selector lets an air-conditioning target suggest the mode
            // and the power of the same unit.
            const entry = {
              selector: feature.selector,
              label: `${device.name} - ${feature.name}`,
              min: feature.min,
              max: feature.max,
              unit: feature.unit,
              roomId: device.room_id || null,
              deviceSelector: device.selector,
              category: feature.category
            };
            if (TEMPERATURE_CATEGORIES.includes(feature.category)) {
              temperatureFeatures.push(entry);
            }
            if (HUMIDITY_CATEGORIES.includes(feature.category)) {
              humidityFeatures.push(entry);
            }
            // A pilot-wire heater takes one of six orders on its command wire
            // rather than a contact: the same actuator slot, a different way of
            // driving it. Like the switch, it has to be writable — a module
            // that only publishes its status would refuse every order.
            // The orders it declares, when it does: a 4-order module refuses
            // comfort -1 and -2, which the presets table then does not offer.
            if (
              feature.category === DEVICE_FEATURE_CATEGORIES.HEATER &&
              feature.type === DEVICE_FEATURE_TYPES.HEATER.PILOT_WIRE_MODE &&
              !feature.read_only
            ) {
              pilotWireFeatures.push({
                ...entry,
                supportedOrders: (feature.supported_options || []).map(option => option.value)
              });
            }
            if (SWITCH_CATEGORIES.includes(feature.category) && feature.type === DEVICE_FEATURE_TYPES.SWITCH.BINARY) {
              // The actuator has to be writable: a read-only switch — Netatmo's
              // boiler contact, for one — was offered as something to drive, and
              // every write onto it would be refused. It stays eligible as a
              // *state* feature below, which is exactly what it is good for.
              if (!feature.read_only) {
                switchFeatures.push(entry);
              }
              // No integration publishes thermostat/operating-state yet: Netatmo
              // reports its boiler contact as a read-only switch, and that is the
              // only "is it heating" signal most real thermostats expose.
              if (!isOwnThermostat) {
                stateFeatures.push(entry);
              }
            }
            if (OPENING_CATEGORIES.includes(feature.category)) {
              openingFeatures.push(entry);
            }
            if (isPresenceFeature(feature)) {
              presenceFeatures.push(entry);
            }
            if (!isOwnThermostat) {
              if (isTargetFeature(feature) && !feature.read_only) {
                // Zigbee, Matter and MQTT expose several setpoints on one device
                // (heating/cooling, occupied/unoccupied): only the user knows
                // which one drives their heating, so all of them are offered.
                targetFeatures.push(entry);
              }
              if (
                feature.category === DEVICE_FEATURE_CATEGORIES.THERMOSTAT &&
                feature.type === DEVICE_FEATURE_TYPES.THERMOSTAT.OPERATING_STATE
              ) {
                stateFeatures.push(entry);
              }
              if (isModeFeature(feature) && !feature.read_only) {
                modeFeatures.push(entry);
              }
              // The power is written, so it has to be writable: a read-only boiler
              // contact is a state feature, not a way to stop anything.
              if (isPowerFeature(feature) && !feature.read_only) {
                powerFeatures.push(entry);
              }
            }
          });
        });
        store.setState({
          temperatureFeatures,
          humidityFeatures,
          switchFeatures,
          pilotWireFeatures,
          openingFeatures,
          presenceFeatures,
          targetFeatures,
          stateFeatures,
          modeFeatures,
          powerFeatures
        });
      } catch (e) {
        store.setState({
          temperatureFeatures: [],
          humidityFeatures: [],
          switchFeatures: [],
          pilotWireFeatures: [],
          openingFeatures: [],
          presenceFeatures: [],
          targetFeatures: [],
          stateFeatures: [],
          modeFeatures: [],
          powerFeatures: []
        });
      }
    },

    async getThermostatDevice(state, selector) {
      store.setState({ getThermostatDeviceStatus: RequestStatus.Getting });
      try {
        const device = await state.httpClient.get(`/api/v1/device/${selector}`);
        const getParam = name => {
          const p = (device.params || []).find(x => x.name === name);
          return p ? p.value : null;
        };
        // Which schedule the thermostat follows is a relation, so the schedule
        // that lists it is the one it follows.
        let activeSchedule = '';
        try {
          const schedules = await state.httpClient.get('/api/v1/service/thermostat/schedule');
          const followed = (schedules || []).find(schedule =>
            (schedule.devices || []).some(followedDevice => followedDevice.selector === device.selector)
          );
          activeSchedule = followed ? followed.selector : '';
        } catch (e) {
          activeSchedule = '';
        }
        const presetDefaults = defaultPresetTemps(getParam('THERMOSTAT_MODE'));
        store.setState({
          thermostatEditActiveSchedule: activeSchedule,
          thermostatEditDeviceSchedule: activeSchedule,
          thermostatEditDevice: device,
          thermostatEditName: device.name,
          thermostatEditMode: getParam('THERMOSTAT_MODE') || 'heating',
          thermostatEditMinTemp: getParam('THERMOSTAT_MIN_TEMP') || '5',
          thermostatEditMaxTemp: getParam('THERMOSTAT_MAX_TEMP') || '35',
          thermostatEditTempUnit: getParam('THERMOSTAT_TEMP_UNIT') || 'C',
          thermostatEditControlType: getParam('THERMOSTAT_CONTROL_TYPE') || 'hysteresis',
          // One sensor or several (spec A.1.1).
          thermostatEditTemperatureFeatures: parseSelectorList(getParam('THERMOSTAT_TEMPERATURE_FEATURE')),
          thermostatEditHumidityFeature: getParam('THERMOSTAT_HUMIDITY_FEATURE') || '',
          thermostatEditSwitchFeature: getParam('THERMOSTAT_SWITCH_FEATURE') || '',
          thermostatEditPilotWireFeature: getParam('THERMOSTAT_PILOT_WIRE_FEATURE') || '',
          thermostatEditPilotWireOrders: readPilotWireOrders(getParam),
          // A real thermostat given a pilot wire was how a heater regulating
          // itself was saved before it had a type of its own: it is shown as one.
          thermostatEditType:
            getParam('THERMOSTAT_TYPE') === 'external' && getParam('THERMOSTAT_PILOT_WIRE_FEATURE')
              ? 'pilot-wire'
              : getParam('THERMOSTAT_TYPE') || 'virtual',
          thermostatEditTargetFeature: getParam('THERMOSTAT_TARGET_FEATURE') || '',
          thermostatEditStateFeature: getParam('THERMOSTAT_STATE_FEATURE') || '',
          thermostatEditModeFeature: getParam('THERMOSTAT_MODE_FEATURE') || '',
          thermostatEditPowerFeature: getParam('THERMOSTAT_POWER_FEATURE') || '',
          thermostatEditWindowFeatures: parseSelectorList(getParam('THERMOSTAT_WINDOW_FEATURE')),
          // A thermostat saved before the delay existed has none: the server
          // waits its default minute, which is what the field shows.
          thermostatEditWindowDelay: getParam('THERMOSTAT_WINDOW_DELAY') || '60',
          thermostatEditPresenceFeatures: parseSelectorList(getParam('THERMOSTAT_PRESENCE_FEATURE')),
          thermostatEditPresenceDelay: getParam('THERMOSTAT_PRESENCE_DELAY') || String(DEFAULT_PRESENCE_DELAY_MINUTES),
          // A preset the server would not take is shown as the one it uses instead.
          thermostatEditPresencePreset: PRESENCE_PRESETS.includes(getParam('THERMOSTAT_PRESENCE_PRESET'))
            ? getParam('THERMOSTAT_PRESENCE_PRESET')
            : DEFAULT_PRESENCE_PRESET,
          // A display choice, never saved: every thermostat opens on its own room.
          thermostatEditShowAllRooms: false,
          thermostatEditPresetFrost: getParam('THERMOSTAT_PRESET_FROST') || String(presetDefaults.frost),
          thermostatEditPresetAway: getParam('THERMOSTAT_PRESET_AWAY') || String(presetDefaults.away),
          thermostatEditPresetEco: getParam('THERMOSTAT_PRESET_ECO') || String(presetDefaults.eco),
          thermostatEditPresetNight: getParam('THERMOSTAT_PRESET_NIGHT') || String(presetDefaults.night),
          thermostatEditPresetComfort: getParam('THERMOSTAT_PRESET_COMFORT') || String(presetDefaults.comfort),
          thermostatEditHysteresisStart: getParam('THERMOSTAT_HYSTERESIS_START') || '0.5',
          thermostatEditHysteresisStop: getParam('THERMOSTAT_HYSTERESIS_STOP') || '0.5',
          thermostatEditTpiCycleTime: getParam('THERMOSTAT_TPI_CYCLE_TIME') || '30',
          thermostatEditTpiProportionalBand: getParam('THERMOSTAT_TPI_PROPORTIONAL_BAND') || '2',
          thermostatEditRoomId: device.room_id || '',
          thermostatEditManualDuration: getParam('THERMOSTAT_MANUAL_DURATION') || '30',
          // No duration configured is how "hand it back at the next slot" is
          // stored: the server falls back on the next transition point when the
          // param is absent, so the param's absence *is* the setting.
          thermostatEditManualExpiry: getParam('THERMOSTAT_MANUAL_DURATION') ? 'fixed' : 'next-transition',
          getThermostatDeviceStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({ getThermostatDeviceStatus: RequestStatus.Error });
      }
    },

    updateThermostatField(state, field, value) {
      store.setState({ [field]: value });
    },

    // The switch and the pilot wire are the same actuator slot: picking one
    // empties the other, so the form can never describe a heater driven both
    // ways at once. A pilot wire also leaves TPI: the loop never pulses its
    // orders within a cycle (spec C.1.1).
    updateThermostatActuator(state, field, value) {
      const pilotWire = field === 'thermostatEditPilotWireFeature';
      const other = pilotWire ? 'thermostatEditSwitchFeature' : 'thermostatEditPilotWireFeature';
      const next = value ? { [field]: value, [other]: '' } : { [field]: value };
      if (pilotWire && value && state.thermostatEditControlType === 'tpi') {
        next.thermostatEditControlType = 'hysteresis';
      }
      // A pilot-wire heater only heats, and the presets come along as on any
      // change of use.
      if (pilotWire && value && state.thermostatEditMode === 'cooling') {
        Object.assign(next, { thermostatEditMode: 'heating' }, carriedPresets(state, 'cooling', 'heating'));
      }
      store.setState(next);
    },

    // The order a preset sends a pilot-wire heater that regulates itself.
    updateThermostatPilotWireOrder(state, preset, order) {
      store.setState({
        thermostatEditPilotWireOrders: {
          ...(state.thermostatEditPilotWireOrders || DEFAULT_PILOT_WIRE_ORDERS),
          [preset]: order
        }
      });
    },

    updateThermostatMode(state, mode) {
      const previous = state.thermostatEditMode || 'heating';
      store.setState({ thermostatEditMode: mode, ...carriedPresets(state, previous, mode) });
    },

    updateThermostatUnit(state, newUnit) {
      const oldUnit = state.thermostatEditTempUnit || 'C';
      if (oldUnit === newUnit) return;
      const isSet = v => v !== '' && v !== null && v !== undefined;
      const round = v => String(Math.round(v * 2) / 2);
      // Absolute temperatures (setpoints, min/max) carry the 32° offset...
      const toF = v => (isSet(v) ? round((parseFloat(v) * 9) / 5 + 32) : v);
      const toC = v => (isSet(v) ? round(((parseFloat(v) - 32) * 5) / 9) : v);
      // ...but hysteresis and the TPI band are temperature *differences*: adding
      // the offset would turn a 0.5 °C hysteresis into 32.9 °F.
      const deltaToF = v => (isSet(v) ? round((parseFloat(v) * 9) / 5) : v);
      const deltaToC = v => (isSet(v) ? round((parseFloat(v) * 5) / 9) : v);
      const conv = newUnit === 'F' ? toF : toC;
      const convDelta = newUnit === 'F' ? deltaToF : deltaToC;
      store.setState({
        thermostatEditTempUnit: newUnit,
        thermostatEditMinTemp: conv(state.thermostatEditMinTemp),
        thermostatEditMaxTemp: conv(state.thermostatEditMaxTemp),
        thermostatEditPresetFrost: conv(state.thermostatEditPresetFrost),
        thermostatEditPresetAway: conv(state.thermostatEditPresetAway),
        thermostatEditPresetEco: conv(state.thermostatEditPresetEco),
        thermostatEditPresetNight: conv(state.thermostatEditPresetNight),
        thermostatEditPresetComfort: conv(state.thermostatEditPresetComfort),
        thermostatEditHysteresisStart: convDelta(state.thermostatEditHysteresisStart),
        thermostatEditHysteresisStop: convDelta(state.thermostatEditHysteresisStop),
        thermostatEditTpiProportionalBand: convDelta(state.thermostatEditTpiProportionalBand)
      });
    },

    async saveThermostatDevice(state) {
      store.setState({ thermostatCreateStatus: RequestStatus.Getting, thermostatEditError: null });
      try {
        // `parseFloat(x) || d` turns a legitimate 0 into the default, so a 0 °C
        // hysteresis band could never be saved. Fall back only when the input is
        // not a finite number, like the server-side `toNumber` helper does.
        const toNumber = (value, defaultValue) => {
          const parsed = parseFloat(value);
          return Number.isFinite(parsed) ? parsed : defaultValue;
        };
        const toInt = (value, defaultValue) => {
          const parsed = parseInt(value, 10);
          return Number.isFinite(parsed) ? parsed : defaultValue;
        };

        const name = state.thermostatEditName || 'Thermostat';
        const mode = state.thermostatEditMode || 'heating';
        const minTemp = toNumber(state.thermostatEditMinTemp, 5);
        const maxTemp = toNumber(state.thermostatEditMaxTemp, 35);
        const tempUnit = state.thermostatEditTempUnit || 'C';
        const temperatureFeature = serializeSelectorList(state.thermostatEditTemperatureFeatures);
        const humidityFeature = state.thermostatEditHumidityFeature || '';
        // Three types (spec A.1, C.1.1): `virtual`, regulated by Gladys through a
        // switch or a pilot wire; `external`, a real thermostat driven by its
        // setpoint; `pilot-wire`, a heater regulating itself on the orders sent.
        const thermostatType = ['external', 'pilot-wire'].includes(state.thermostatEditType)
          ? state.thermostatEditType
          : 'virtual';
        const isExternalThermostat = thermostatType === 'external';
        const isPilotWireThermostat = thermostatType === 'pilot-wire';
        // A real thermostat never carries a pilot wire: one left in the form from
        // another type is dropped rather than saved.
        const pilotWireFeature = isExternalThermostat ? '' : state.thermostatEditPilotWireFeature || '';
        // A pilot wire is regulated on hysteresis only: a TPI saved before it was
        // picked would be offered nowhere in the form and ignored by the loop.
        const pickedControlType = state.thermostatEditControlType || 'hysteresis';
        const controlType = pilotWireFeature && pickedControlType === 'tpi' ? 'hysteresis' : pickedControlType;
        // A heater is driven by one actuator or the other, never both: the form
        // clears one when the other is picked, and the save holds to it for a
        // device that already carried both.
        const switchFeature =
          thermostatType !== 'virtual' || pilotWireFeature ? '' : state.thermostatEditSwitchFeature || '';
        const pilotWireOrders = state.thermostatEditPilotWireOrders || DEFAULT_PILOT_WIRE_ORDERS;
        const windowFeature = serializeSelectorList(state.thermostatEditWindowFeatures);
        // `|| default` would discard an explicitly entered 0, which the preset
        // inputs accept: toNumber only falls back when the value is not a number.
        const presetFrost = String(toNumber(state.thermostatEditPresetFrost, 7));
        const presetAway = String(toNumber(state.thermostatEditPresetAway, 16));
        const presetEco = String(toNumber(state.thermostatEditPresetEco, 18));
        const presetNight = String(toNumber(state.thermostatEditPresetNight, 17));
        const presetComfort = String(toNumber(state.thermostatEditPresetComfort, 21));
        const hysteresisStart = toNumber(state.thermostatEditHysteresisStart, 0.5);
        const hysteresisStop = toNumber(state.thermostatEditHysteresisStop, 0.5);
        const tpiCycleTime = toInt(state.thermostatEditTpiCycleTime, 30);
        const tpiProportionalBand = toNumber(state.thermostatEditTpiProportionalBand, 2);
        const manualDuration = toInt(state.thermostatEditManualDuration, 30);
        // There is no form submit, so the input's own bounds never apply.
        const windowDelay = Math.min(MAX_WINDOW_DELAY_SECONDS, Math.max(0, toInt(state.thermostatEditWindowDelay, 60)));
        const presenceFeature = serializeSelectorList(state.thermostatEditPresenceFeatures);
        const presenceDelay = Math.min(
          MAX_PRESENCE_DELAY_MINUTES,
          Math.max(MIN_PRESENCE_DELAY_MINUTES, toInt(state.thermostatEditPresenceDelay, DEFAULT_PRESENCE_DELAY_MINUTES))
        );
        const presencePreset = PRESENCE_PRESETS.includes(state.thermostatEditPresencePreset)
          ? state.thermostatEditPresencePreset
          : DEFAULT_PRESENCE_PRESET;

        const isEdit = !!(state.thermostatEditDevice && state.thermostatEditDevice.selector);
        const timestamp = Date.now();
        const slugName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const newExternalId = `thermostat:${slugName}-${timestamp}`;

        // A pilot-wire heater only heats: a cooling mode picked before it would
        // show cooling while the loop heats (spec C.1.1).
        const savedMode = pilotWireFeature || isPilotWireThermostat ? 'heating' : mode;

        // Saving an empty form used to create a thermostat with no room, no
        // sensor and no actuator: it appeared in the list, regulated nothing, and
        // nothing said why. What makes a thermostat is the pair it drives — a
        // sensor to read and a switch to actuate, or the setpoint of a real
        // thermostat — so that is what is required, named in the error rather
        // than reported as a generic failure. On a virtual thermostat the
        // actuator is a switch or a pilot wire, and either way Gladys regulates on
        // the sensor; a real one is driven by its setpoint, and a pilot-wire
        // heater regulating itself needs only its pilot wire.
        const missingConfig = {
          external: !state.thermostatEditTargetFeature,
          'pilot-wire': !pilotWireFeature,
          virtual: !temperatureFeature || (!switchFeature && !pilotWireFeature)
        }[thermostatType];
        if (missingConfig) {
          store.setState({
            thermostatCreateStatus: RequestStatus.Error,
            thermostatEditError: {
              external: 'incompleteExternal',
              'pilot-wire': 'incompletePilotWire',
              virtual: 'incompleteVirtual'
            }[thermostatType]
          });
          return;
        }

        const device = {
          name,
          external_id: isEdit ? state.thermostatEditDevice.external_id : newExternalId,
          selector: isEdit ? state.thermostatEditDevice.selector : undefined,
          should_poll: false,
          // An external thermostat carries no setpoint feature of its own: the
          // setpoint is the real device's, named by THERMOSTAT_TARGET_FEATURE.
          // Creating a second one here would give the house two setpoints that
          // drift apart. A pilot-wire heater has no real setpoint, and owns one.
          features: isExternalThermostat
            ? []
            : [
                {
                  // The thermostat/target-temperature category already means "setpoint"
                  // in every language; a hardcoded French suffix would leak into the
                  // device name shown in scenes, MQTT and every UI.
                  name,
                  external_id: isEdit
                    ? `${state.thermostatEditDevice.external_id}:target-temperature`
                    : `${newExternalId}:target-temperature`,
                  category: 'thermostat',
                  type: 'target-temperature',
                  read_only: false,
                  keep_history: true,
                  has_feedback: false,
                  min: minTemp,
                  max: maxTemp,
                  unit: tempUnit === 'F' ? 'fahrenheit' : 'celsius'
                }
              ],
          room_id: state.thermostatEditRoomId || undefined,
          params: [
            // The active schedule is device-owned: the dashboard widget only
            // chooses which thermostat to display, it never drives regulation.
            { name: 'THERMOSTAT_MODE', value: savedMode },
            { name: 'THERMOSTAT_MIN_TEMP', value: String(minTemp) },
            { name: 'THERMOSTAT_MAX_TEMP', value: String(maxTemp) },
            { name: 'THERMOSTAT_TEMP_UNIT', value: tempUnit },
            { name: 'THERMOSTAT_CONTROL_TYPE', value: controlType },
            { name: 'THERMOSTAT_TEMPERATURE_FEATURE', value: temperatureFeature },
            { name: 'THERMOSTAT_HUMIDITY_FEATURE', value: humidityFeature },
            { name: 'THERMOSTAT_SWITCH_FEATURE', value: switchFeature },
            { name: 'THERMOSTAT_PILOT_WIRE_FEATURE', value: pilotWireFeature },
            // The order each preset sends, on a heater regulating itself only:
            // the other types send none, and cleared there like the real
            // thermostat's params below (spec A.1).
            ...Object.keys(DEFAULT_PILOT_WIRE_ORDERS).map(preset => ({
              name: PILOT_WIRE_ORDER_PARAM(preset),
              value: isPilotWireThermostat ? String(pilotWireOrders[preset]) : ''
            })),
            { name: 'THERMOSTAT_TYPE', value: thermostatType },
            // Only meaningful on a real thermostat, and cleared otherwise so
            // switching a device to another type cannot leave it driving a real
            // one through a stale param.
            {
              name: 'THERMOSTAT_TARGET_FEATURE',
              value: isExternalThermostat ? state.thermostatEditTargetFeature || '' : ''
            },
            {
              name: 'THERMOSTAT_STATE_FEATURE',
              value: isExternalThermostat ? state.thermostatEditStateFeature || '' : ''
            },
            {
              name: 'THERMOSTAT_MODE_FEATURE',
              value: isExternalThermostat ? state.thermostatEditModeFeature || '' : ''
            },
            {
              name: 'THERMOSTAT_POWER_FEATURE',
              value: isExternalThermostat ? state.thermostatEditPowerFeature || '' : ''
            },
            { name: 'THERMOSTAT_WINDOW_FEATURE', value: windowFeature },
            { name: 'THERMOSTAT_WINDOW_DELAY', value: String(windowDelay) },
            { name: 'THERMOSTAT_PRESENCE_FEATURE', value: presenceFeature },
            { name: 'THERMOSTAT_PRESENCE_DELAY', value: String(presenceDelay) },
            { name: 'THERMOSTAT_PRESENCE_PRESET', value: presencePreset },
            { name: 'THERMOSTAT_PRESET_FROST', value: presetFrost },
            { name: 'THERMOSTAT_PRESET_AWAY', value: presetAway },
            { name: 'THERMOSTAT_PRESET_ECO', value: presetEco },
            { name: 'THERMOSTAT_PRESET_NIGHT', value: presetNight },
            { name: 'THERMOSTAT_PRESET_COMFORT', value: presetComfort },
            { name: 'THERMOSTAT_HYSTERESIS_START', value: String(hysteresisStart) },
            { name: 'THERMOSTAT_HYSTERESIS_STOP', value: String(hysteresisStop) },
            { name: 'THERMOSTAT_TPI_CYCLE_TIME', value: String(tpiCycleTime) },
            { name: 'THERMOSTAT_TPI_PROPORTIONAL_BAND', value: String(tpiProportionalBand) },
            // Left out on "next transition": createDevice deletes every param the
            // payload omits, and an absent duration is what makes the server hold
            // until the next schedule point rather than for a fixed time.
            ...(state.thermostatEditManualExpiry === 'next-transition'
              ? []
              : [{ name: 'THERMOSTAT_MANUAL_DURATION', value: String(manualDuration) }])
          ]
        };

        // The device is the single store for the configuration: every field above
        // is a device param. Writing a THERMOSTAT_CONFIG_* variable as well would
        // reintroduce two sources of truth for the same settings, and a failure
        // between the two writes would leave them disagreeing.
        const savedDevice = await state.httpClient.post('/api/v1/service/thermostat/device', device);
        // From here on the thermostat exists. If the schedule link below is
        // refused, the next Save must edit it: left as a creation, it built a new
        // external_id and added a second thermostat on every retry.
        if (!isEdit && savedDevice && savedDevice.selector) {
          store.setState({ thermostatEditDevice: savedDevice });
        }

        // The schedule link is written through the schedule's own routes, which
        // also check the thermostat belongs to that schedule's house.
        const previousSchedule = (state.thermostatEditDevice && state.thermostatEditDeviceSchedule) || '';
        const wantedSchedule = state.thermostatEditActiveSchedule || '';
        if (wantedSchedule !== previousSchedule && savedDevice && savedDevice.selector) {
          // A refused link is not a detail to swallow: the thermostat would keep
          // following what it followed before while the form claimed success.
          // The device itself is saved either way.
          if (wantedSchedule) {
            await state.httpClient.post(
              `/api/v1/service/thermostat/schedule/${wantedSchedule}/device/${savedDevice.selector}`
            );
          } else if (previousSchedule) {
            await state.httpClient.delete(
              `/api/v1/service/thermostat/schedule/${previousSchedule}/device/${savedDevice.selector}`
            );
          }
        }

        store.setState({
          thermostatCreateStatus: RequestStatus.Success,
          thermostatEditDevice: null,
          thermostatEditName: '',
          thermostatEditMode: 'heating',
          thermostatEditMinTemp: '5',
          thermostatEditMaxTemp: '35',
          thermostatEditTempUnit: 'C',
          thermostatEditControlType: 'hysteresis',
          thermostatEditTemperatureFeatures: [],
          thermostatEditHumidityFeature: '',
          thermostatEditSwitchFeature: '',
          thermostatEditPilotWireFeature: '',
          thermostatEditPilotWireOrders: DEFAULT_PILOT_WIRE_ORDERS,
          thermostatEditType: 'virtual',
          thermostatEditTargetFeature: '',
          thermostatEditStateFeature: '',
          thermostatEditModeFeature: '',
          thermostatEditPowerFeature: '',
          thermostatEditWindowFeatures: [],
          thermostatEditWindowDelay: '60',
          thermostatEditPresenceFeatures: [],
          thermostatEditPresenceDelay: String(DEFAULT_PRESENCE_DELAY_MINUTES),
          thermostatEditPresencePreset: DEFAULT_PRESENCE_PRESET,
          thermostatEditShowAllRooms: false,
          thermostatEditActiveSchedule: '',
          thermostatEditPresetFrost: '7',
          thermostatEditPresetAway: '16',
          thermostatEditPresetEco: '18',
          thermostatEditPresetNight: '17',
          thermostatEditPresetComfort: '21',
          thermostatEditHysteresisStart: '0.5',
          thermostatEditHysteresisStop: '0.5',
          thermostatEditTpiCycleTime: '30',
          thermostatEditTpiProportionalBand: '2',
          thermostatEditRoomId: '',
          thermostatEditManualDuration: '30',
          // The spec's default on a scheduled thermostat (F): a temperature set
          // in the afternoon holds until the evening point rather than lapsing
          // after an arbitrary half hour, which is the Tado and Netatmo
          // behaviour. Without a schedule the hold is permanent either way.
          thermostatEditManualExpiry: 'next-transition'
        });
        route('/dashboard/integration/device/thermostat');
      } catch (e) {
        store.setState({ thermostatCreateStatus: RequestStatus.Error });
      }
    }
  };

  return Object.assign({}, houseActions, actions);
}

export default createActions;
