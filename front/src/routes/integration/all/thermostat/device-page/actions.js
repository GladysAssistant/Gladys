import { RequestStatus } from '../../../../../utils/consts';
import update from 'immutability-helper';
import debounce from 'debounce';
import createActionsHouse from '../../../../../actions/house';

function createActions(store) {
  const houseActions = createActionsHouse(store);
  const actions = {
    async getThermostatDevices(state) {
      store.setState({ getThermostatDevicesStatus: RequestStatus.Getting });
      try {
        const options = {
          order_dir: state.getThermostatDeviceOrderDir || 'asc'
        };
        if (state.thermostatDeviceSearch && state.thermostatDeviceSearch.length) {
          options.search = state.thermostatDeviceSearch;
        }
        const allDevices = await state.httpClient.get('/api/v1/service/thermostat/device', options);
        const filtered = Array.isArray(allDevices) ? allDevices : [];
        // The active schedule is a device param, so it comes back with the device:
        // no extra variable round-trip per thermostat.
        const enriched = filtered.map(device => {
          const param = (device.params || []).find(p => p.name === 'THERMOSTAT_ACTIVE_SCHEDULE');
          return { ...device, active_schedule: (param && param.value) || '' };
        });
        store.setState({
          thermostatDevices: enriched,
          getThermostatDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          thermostatDevices: [],
          getThermostatDevicesStatus: RequestStatus.Error
        });
      }
    },
    async saveDevice(state, device, index) {
      const { active_schedule, ...deviceToSave } = device;
      // Persist the schedule as a device param rather than a global variable.
      const otherParams = (deviceToSave.params || []).filter(p => p.name !== 'THERMOSTAT_ACTIVE_SCHEDULE');
      deviceToSave.params = [...otherParams, { name: 'THERMOSTAT_ACTIVE_SCHEDULE', value: active_schedule || '' }];
      const savedDevice = await state.httpClient.post('/api/v1/device', deviceToSave);
      // Read the schedule back from what the server actually stored rather than
      // from the form value: the widget derives its banner from this param, and
      // showing an unsaved value would make it disagree with the regulation.
      const savedParam = (savedDevice.params || []).find(p => p.name === 'THERMOSTAT_ACTIVE_SCHEDULE');
      const savedSchedule = savedParam ? savedParam.value : active_schedule || '';
      const newState = update(state, {
        thermostatDevices: {
          $splice: [[index, 1, { ...savedDevice, active_schedule: savedSchedule }]]
        }
      });
      store.setState(newState);
      // Apply the new schedule now instead of waiting for the next minute tick.
      try {
        await state.httpClient.post('/api/v1/service/thermostat/apply-schedules', {});
      } catch (e) {
        // The regulation loop picks it up within a minute anyway.
      }
    },
    updateDeviceProperty(state, index, property, value) {
      const newState = update(state, {
        thermostatDevices: {
          [index]: {
            [property]: { $set: value }
          }
        }
      });
      store.setState(newState);
    },
    async getSchedules(state) {
      try {
        const schedules = await state.httpClient.get('/api/v1/service/thermostat/schedule');
        store.setState({ thermostatSchedules: Array.isArray(schedules) ? schedules : [] });
      } catch (e) {
        store.setState({ thermostatSchedules: [] });
      }
    },
    async deleteDevice(state, device, index) {
      await state.httpClient.delete(`/api/v1/device/${device.selector}`);
      const newState = update(state, {
        thermostatDevices: { $splice: [[index, 1]] }
      });
      store.setState(newState);
    },
    async search(state, e) {
      await store.setState({ thermostatDeviceSearch: e.target.value });
      actions.debouncedGetThermostatDevices(store.getState());
    },
    async changeOrderDir(state, e) {
      store.setState({ getThermostatDeviceOrderDir: e.target.value });
      await actions.getThermostatDevices(store.getState());
    }
  };
  actions.debouncedGetThermostatDevices = debounce(actions.getThermostatDevices, 200);
  return Object.assign({}, houseActions, actions);
}

export default createActions;
