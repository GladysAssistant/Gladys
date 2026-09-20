import { connect } from 'unistore/preact';
import actions from './actions';
import SchedulePage from './SchedulePage';

export default connect(
  'user,httpClient,houses,thermostatSchedules,thermostatScheduleSearch,getThermostatScheduleOrderDir,getSchedulesStatus,saveScheduleStatus,deleteScheduleStatus',
  actions
)(SchedulePage);
