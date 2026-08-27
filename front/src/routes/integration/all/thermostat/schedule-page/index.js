import { connect } from 'unistore/preact';
import actions from './actions';
import SchedulePage from './SchedulePage';

export default connect(
  'user,httpClient,thermostatSchedules,getSchedulesStatus,saveScheduleStatus,deleteScheduleStatus',
  actions
)(SchedulePage);
