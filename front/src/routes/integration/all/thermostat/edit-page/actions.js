import { RequestStatus } from '../../../../../utils/consts';
import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../../server/utils/constants';
import { route } from 'preact-router';
import createActionsHouse from '../../../../../actions/house';

const TEMPERATURE_CATEGORIES = [DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR];
const HUMIDITY_CATEGORIES = [DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR];
const SWITCH_CATEGORIES = [DEVICE_FEATURE_CATEGORIES.SWITCH];
const OPENING_CATEGORIES = [DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR];

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
        devices.forEach(device => {
          device.features.forEach(feature => {
            const entry = { selector: feature.selector, label: `${device.name} - ${feature.name}` };
            if (TEMPERATURE_CATEGORIES.includes(feature.category)) {
              temperatureFeatures.push(entry);
            }
            if (HUMIDITY_CATEGORIES.includes(feature.category)) {
              humidityFeatures.push(entry);
            }
            if (SWITCH_CATEGORIES.includes(feature.category) && feature.type === 'binary') {
              switchFeatures.push(entry);
            }
            if (OPENING_CATEGORIES.includes(feature.category)) {
              openingFeatures.push(entry);
            }
          });
        });
        store.setState({ temperatureFeatures, humidityFeatures, switchFeatures, openingFeatures });
      } catch (e) {
        store.setState({ temperatureFeatures: [], humidityFeatures: [], switchFeatures: [] });
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
        store.setState({
          thermostatEditDevice: device,
          thermostatEditName: device.name,
          thermostatEditMode: getParam('THERMOSTAT_MODE') || 'heating',
          thermostatEditMinTemp: getParam('THERMOSTAT_MIN_TEMP') || '5',
          thermostatEditMaxTemp: getParam('THERMOSTAT_MAX_TEMP') || '35',
          thermostatEditTempUnit: getParam('THERMOSTAT_TEMP_UNIT') || 'C',
          thermostatEditControlType: getParam('THERMOSTAT_CONTROL_TYPE') || 'hysteresis',
          thermostatEditActiveSchedule: getParam('THERMOSTAT_ACTIVE_SCHEDULE') || '',
          thermostatEditTemperatureFeature: getParam('THERMOSTAT_TEMPERATURE_FEATURE') || '',
          thermostatEditHumidityFeature: getParam('THERMOSTAT_HUMIDITY_FEATURE') || '',
          thermostatEditSwitchFeature: getParam('THERMOSTAT_SWITCH_FEATURE') || '',
          thermostatEditWindowFeature: getParam('THERMOSTAT_WINDOW_FEATURE') || '',
          thermostatEditPresetFrost: getParam('THERMOSTAT_PRESET_FROST') || '7',
          thermostatEditPresetAway: getParam('THERMOSTAT_PRESET_AWAY') || '16',
          thermostatEditPresetEco: getParam('THERMOSTAT_PRESET_ECO') || '18',
          thermostatEditPresetNight: getParam('THERMOSTAT_PRESET_NIGHT') || '17',
          thermostatEditPresetComfort: getParam('THERMOSTAT_PRESET_COMFORT') || '21',
          thermostatEditHysteresisStart: getParam('THERMOSTAT_HYSTERESIS_START') || '0.5',
          thermostatEditHysteresisStop: getParam('THERMOSTAT_HYSTERESIS_STOP') || '0.5',
          thermostatEditTpiCycleTime: getParam('THERMOSTAT_TPI_CYCLE_TIME') || '30',
          thermostatEditTpiProportionalBand: getParam('THERMOSTAT_TPI_PROPORTIONAL_BAND') || '2',
          thermostatEditRoomId: device.room_id || '',
          thermostatEditManualDuration: getParam('THERMOSTAT_MANUAL_DURATION') || '30',
          getThermostatDeviceStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({ getThermostatDeviceStatus: RequestStatus.Error });
      }
    },

    updateThermostatField(state, field, value) {
      store.setState({ [field]: value });
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
      store.setState({ thermostatCreateStatus: RequestStatus.Getting });
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
        const controlType = state.thermostatEditControlType || 'hysteresis';
        const temperatureFeature = state.thermostatEditTemperatureFeature || '';
        const humidityFeature = state.thermostatEditHumidityFeature || '';
        const switchFeature = state.thermostatEditSwitchFeature || '';
        const windowFeature = state.thermostatEditWindowFeature || '';
        const presetFrost = state.thermostatEditPresetFrost || '7';
        const presetAway = state.thermostatEditPresetAway || '16';
        const presetEco = state.thermostatEditPresetEco || '18';
        const presetNight = state.thermostatEditPresetNight || '17';
        const presetComfort = state.thermostatEditPresetComfort || '21';
        const hysteresisStart = toNumber(state.thermostatEditHysteresisStart, 0.5);
        const hysteresisStop = toNumber(state.thermostatEditHysteresisStop, 0.5);
        const tpiCycleTime = toInt(state.thermostatEditTpiCycleTime, 30);
        const tpiProportionalBand = toNumber(state.thermostatEditTpiProportionalBand, 2);
        const manualDuration = toInt(state.thermostatEditManualDuration, 30);

        const isEdit = !!(state.thermostatEditDevice && state.thermostatEditDevice.selector);
        const timestamp = Date.now();
        const slugName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const newExternalId = `thermostat:${slugName}-${timestamp}`;

        const device = {
          name,
          external_id: isEdit ? state.thermostatEditDevice.external_id : newExternalId,
          selector: isEdit ? state.thermostatEditDevice.selector : undefined,
          should_poll: false,
          features: [
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
            { name: 'THERMOSTAT_ACTIVE_SCHEDULE', value: state.thermostatEditActiveSchedule || '' },
            { name: 'THERMOSTAT_MODE', value: mode },
            { name: 'THERMOSTAT_MIN_TEMP', value: String(minTemp) },
            { name: 'THERMOSTAT_MAX_TEMP', value: String(maxTemp) },
            { name: 'THERMOSTAT_TEMP_UNIT', value: tempUnit },
            { name: 'THERMOSTAT_CONTROL_TYPE', value: controlType },
            { name: 'THERMOSTAT_TEMPERATURE_FEATURE', value: temperatureFeature },
            { name: 'THERMOSTAT_HUMIDITY_FEATURE', value: humidityFeature },
            { name: 'THERMOSTAT_SWITCH_FEATURE', value: switchFeature },
            { name: 'THERMOSTAT_WINDOW_FEATURE', value: windowFeature },
            { name: 'THERMOSTAT_PRESET_FROST', value: presetFrost },
            { name: 'THERMOSTAT_PRESET_AWAY', value: presetAway },
            { name: 'THERMOSTAT_PRESET_ECO', value: presetEco },
            { name: 'THERMOSTAT_PRESET_NIGHT', value: presetNight },
            { name: 'THERMOSTAT_PRESET_COMFORT', value: presetComfort },
            { name: 'THERMOSTAT_HYSTERESIS_START', value: String(hysteresisStart) },
            { name: 'THERMOSTAT_HYSTERESIS_STOP', value: String(hysteresisStop) },
            { name: 'THERMOSTAT_TPI_CYCLE_TIME', value: String(tpiCycleTime) },
            { name: 'THERMOSTAT_TPI_PROPORTIONAL_BAND', value: String(tpiProportionalBand) },
            { name: 'THERMOSTAT_MANUAL_DURATION', value: String(manualDuration) }
          ]
        };

        // The device is the single store for the configuration: every field above
        // is a device param. Writing a THERMOSTAT_CONFIG_* variable as well would
        // reintroduce two sources of truth for the same settings, and a failure
        // between the two writes would leave them disagreeing.
        await state.httpClient.post('/api/v1/service/thermostat/device', device);

        store.setState({
          thermostatCreateStatus: RequestStatus.Success,
          thermostatEditDevice: null,
          thermostatEditName: '',
          thermostatEditMode: 'heating',
          thermostatEditMinTemp: '5',
          thermostatEditMaxTemp: '35',
          thermostatEditTempUnit: 'C',
          thermostatEditControlType: 'hysteresis',
          thermostatEditTemperatureFeature: '',
          thermostatEditHumidityFeature: '',
          thermostatEditSwitchFeature: '',
          thermostatEditWindowFeature: '',
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
          thermostatEditManualDuration: '30'
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
