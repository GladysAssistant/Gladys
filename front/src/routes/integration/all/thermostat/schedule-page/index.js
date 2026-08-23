import { connect } from 'unistore/preact';
import actions from './actions';
import SchedulePage from './SchedulePage';

export default connect(
  'httpClient,thermostatSchedules,getSchedulesStatus,saveScheduleStatus,deleteScheduleStatus',
  actions
)(SchedulePage);
