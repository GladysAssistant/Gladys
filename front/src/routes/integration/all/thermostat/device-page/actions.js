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
        const [allDevices, schedules] = await Promise.all([
          state.httpClient.get('/api/v1/service/thermostat/device', options),
          // Which schedule a thermostat follows is a relation now, and each
          // schedule lists the thermostats that follow it: one request for the
          // whole page rather than a lookup per device.
          state.httpClient.get('/api/v1/service/thermostat/schedule').catch(() => [])
        ]);
        const filtered = Array.isArray(allDevices) ? allDevices : [];
        const scheduleByDevice = {};
        (Array.isArray(schedules) ? schedules : []).forEach(schedule => {
          (schedule.devices || []).forEach(device => {
            scheduleByDevice[device.selector] = schedule.selector;
          });
        });
        const enriched = filtered.map(device => {
          const getParam = name => {
            const param = (device.params || []).find(p => p.name === name);
            return (param && param.value) || '';
          };
          return {
            ...device,
            active_schedule: scheduleByDevice[device.selector] || '',
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
      const savedDevice = await state.httpClient.post('/api/v1/device', deviceToSave);
      // Which schedule a thermostat follows is a relation, not a param: it is
      // written through the schedule's own routes, which also check the device is
      // a thermostat of that schedule's house.
      const previous = state.thermostatDevices[index] || {};
      let savedSchedule = active_schedule || '';
      if (savedSchedule !== (previous.active_schedule || '')) {
        try {
          if (savedSchedule) {
            await state.httpClient.post(
              `/api/v1/service/thermostat/schedule/${savedSchedule}/device/${savedDevice.selector}`
            );
          } else if (previous.active_schedule) {
            await state.httpClient.delete(
              `/api/v1/service/thermostat/schedule/${previous.active_schedule}/device/${savedDevice.selector}`
            );
          }
        } catch (e) {
          // The link was refused (the thermostat is not in that schedule's
          // house): keep showing what the server actually holds.
          savedSchedule = previous.active_schedule || '';
        }
      }
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
      // No regulation pass to trigger: attaching a schedule already debounces one
      // server-side, and a plain device save is picked up on the next minute tick.
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
