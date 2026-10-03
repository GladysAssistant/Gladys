import { RequestStatus } from '../../../../../utils/consts';
import createHouseActions from '../../../../../actions/house';

function createActions(store) {
  const houseActions = createHouseActions(store);
  const actions = {
    // A schedule belongs to a house, so the page needs the house list to group
    // the schedules and to say where a new one goes.
    getHouses: houseActions.getHouses,
    async getSchedules(state) {
      store.setState({ getSchedulesStatus: RequestStatus.Getting });
      try {
        const schedules = await state.httpClient.get('/api/v1/service/thermostat/schedule');
        store.setState({ thermostatSchedules: schedules, getSchedulesStatus: RequestStatus.Success });
      } catch (e) {
        store.setState({ getSchedulesStatus: RequestStatus.Error });
      }
    },

    async createSchedule(state, scheduleData) {
      store.setState({ saveScheduleStatus: RequestStatus.Getting });
      try {
        const created = await state.httpClient.post('/api/v1/service/thermostat/schedule', scheduleData);
        const schedules = (state.thermostatSchedules || []).concat(created);
        store.setState({ thermostatSchedules: schedules, saveScheduleStatus: RequestStatus.Success });
        return created;
      } catch (e) {
        store.setState({ saveScheduleStatus: RequestStatus.Error });
        return null;
      }
    },

    async updateSchedule(state, selector, scheduleData) {
      store.setState({ saveScheduleStatus: RequestStatus.Getting });
      try {
        const updated = await state.httpClient.patch(`/api/v1/service/thermostat/schedule/${selector}`, scheduleData);
        const schedules = (state.thermostatSchedules || []).map(s => (s.selector === selector ? updated : s));
        store.setState({ thermostatSchedules: schedules, saveScheduleStatus: RequestStatus.Success });
        return updated;
      } catch (e) {
        store.setState({ saveScheduleStatus: RequestStatus.Error });
        return null;
      }
    },

    async deleteSchedule(state, selector) {
      store.setState({ deleteScheduleStatus: RequestStatus.Getting });
      try {
        await state.httpClient.delete(`/api/v1/service/thermostat/schedule/${selector}`);
        const schedules = (state.thermostatSchedules || []).filter(s => s.selector !== selector);
        store.setState({ thermostatSchedules: schedules, deleteScheduleStatus: RequestStatus.Success });
        return true;
      } catch (e) {
        store.setState({ deleteScheduleStatus: RequestStatus.Error });
        return false;
      }
    },

    // The thermostats, so a schedule can be attached from here rather than by
    // going back to each thermostat's edit page. Only their name, selector and
    // room are used: the room is what places a thermostat in a house, and the
    // server refuses a schedule from another house.
    async getThermostats(state) {
      try {
        const devices = await state.httpClient.get('/api/v1/service/thermostat/device');
        store.setState({ thermostatDevices: devices || [] });
      } catch (e) {
        store.setState({ thermostatDevices: [] });
      }
    },

    // Attaching replaces whatever the thermostat followed before — one schedule
    // per thermostat, which is what the link's primary key enforces server-side.
    // The schedule list is reloaded rather than patched in place: the follower
    // badges of the schedule it left have to lose it too.
    async attachThermostat(state, scheduleSelector, deviceSelector) {
      store.setState({ attachStatus: RequestStatus.Getting, attachError: null });
      try {
        await state.httpClient.post(`/api/v1/service/thermostat/schedule/${scheduleSelector}/device/${deviceSelector}`);
        await actions.getSchedules(store.getState());
        store.setState({ attachStatus: RequestStatus.Success });
      } catch (e) {
        store.setState({ attachStatus: RequestStatus.Error, attachError: scheduleSelector });
      }
    },

    async detachThermostat(state, scheduleSelector, deviceSelector) {
      store.setState({ attachStatus: RequestStatus.Getting, attachError: null });
      try {
        await state.httpClient.delete(
          `/api/v1/service/thermostat/schedule/${scheduleSelector}/device/${deviceSelector}`
        );
        await actions.getSchedules(store.getState());
        store.setState({ attachStatus: RequestStatus.Success });
      } catch (e) {
        store.setState({ attachStatus: RequestStatus.Error, attachError: scheduleSelector });
      }
    },

    updateScheduleField(state, field, value) {
      store.setState({ [field]: value });
    },

    // The whole list is already in memory — a schedule is a name and a handful of
    // points — so searching and sorting happen here rather than through a round
    // trip per keystroke.
    search(state, e) {
      store.setState({ thermostatScheduleSearch: e.target.value });
    },

    changeOrderDir(state, e) {
      store.setState({ getThermostatScheduleOrderDir: e.target.value });
    }
  };
  return actions;
}

export default createActions;
