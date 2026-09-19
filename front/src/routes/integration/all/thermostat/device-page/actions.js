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
          const getParam = name => {
            const param = (device.params || []).find(p => p.name === name);
            return (param && param.value) || '';
          };
          return {
            ...device,
            active_schedule: getParam('THERMOSTAT_ACTIVE_SCHEDULE'),
            // An external thermostat owns no setpoint feature: the card has to
            // read the one on the real device it drives, whose selector is the
            // only trace of it the thermostat device carries.
            thermostat_type: getParam('THERMOSTAT_TYPE') || 'virtual',
            target_feature: getParam('THERMOSTAT_TARGET_FEATURE')
          };
        });
        store.setState({
          thermostatDevices: await actions.withExternalSetpoints(state, enriched),
          getThermostatDevicesStatus: RequestStatus.Success
        });
      } catch (e) {
        store.setState({
          thermostatDevices: [],
          getThermostatDevicesStatus: RequestStatus.Error
        });
      }
    },
    /**
     * Read back the setpoints of the external thermostats.
     *
     * They live on the real devices (a Netatmo, a Zigbee TRV...), which this
     * service's own /device route never returns: without this the card shows
     * "no setpoint" on every thermostat that has one. All of them are fetched
     * in a single call, so the list costs one extra request whatever its size.
     */
    async withExternalSetpoints(state, devices) {
      const selectors = devices
        .filter(device => device.thermostat_type === 'external' && device.target_feature)
        .map(device => device.target_feature);
      if (selectors.length === 0) {
        return devices;
      }
      let bySelector = {};
      try {
        const realDevices = await state.httpClient.get('/api/v1/device', {
          device_feature_selectors: selectors.join(',')
        });
        (realDevices || []).forEach(realDevice => {
          (realDevice.features || []).forEach(feature => {
            if (selectors.includes(feature.selector)) {
              bySelector[feature.selector] = feature;
            }
          });
        });
      } catch (e) {
        // The card falls back to "no setpoint": a thermostat that cannot be
        // read is not a reason to fail the whole list.
        bySelector = {};
      }
      return devices.map(device => {
        const feature = bySelector[device.target_feature];
        return feature ? { ...device, external_setpoint_feature: feature } : device;
      });
    },
    async saveDevice(state, device, index) {
      // Everything the list added for display only is stripped here: the device
      // route validates its payload, and an unknown field makes the save fail.
      const { active_schedule, thermostat_type, target_feature, external_setpoint_feature, ...deviceToSave } = device;
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
          $splice: [
            [
              index,
              1,
              {
                ...savedDevice,
                active_schedule: savedSchedule,
                // The save returns the thermostat device, never the real one it
                // drives: the setpoint read alongside the list is carried over
                // rather than dropped, which would blank the card after a save.
                thermostat_type,
                target_feature,
                external_setpoint_feature
              }
            ]
          ]
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
