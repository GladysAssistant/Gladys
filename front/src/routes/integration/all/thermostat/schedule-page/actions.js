import { RequestStatus } from '../../../../../utils/consts';

function createActions(store) {
  const actions = {
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
      } catch (e) {
        store.setState({ deleteScheduleStatus: RequestStatus.Error });
      }
    },

    updateScheduleField(state, field, value) {
      store.setState({ [field]: value });
    }
  };
  return actions;
}

export default createActions;
