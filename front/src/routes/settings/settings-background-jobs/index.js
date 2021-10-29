import { Component } from 'preact';
import { connect } from 'unistore/preact';

import SettingsBackgroundJobs from './SettingsBackgroundJobs';
import actions from '../../../actions/system';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';

class SettingsSystem extends Component {
  getJobs = async () => {
    try {
      const jobs = await this.props.httpClient.get(`/api/v1/job?take=500`);
      this.setState({
        jobs
      });
    } catch (e) {
      console.error(e);
    }
  };

  getScheduledJobs = async () => {
    try {
      const scheduledJobs = await this.props.httpClient.get(`/api/v1/calendar/schedule?take=500`);
      this.setState({
        scheduledJobs
      });
    } catch (e) {
      console.error(e);
    }
  };

  search = async e => {
    const text = e.target.value;
    await this.setState({
      search: text
    });
    this.getJobs();
  };

  newJob = payload => {
    const { jobs } = this.state;
    jobs.unshift(payload);
    this.setState({
      jobs
    });
  };

  jobUpdated = payload => {
    const { jobs } = this.state;
    const previousJobIndex = jobs.findIndex(j => j.id === payload.id);
    if (previousJobIndex !== -1) {
      jobs[previousJobIndex] = payload;
      this.setState({
        jobs
      });
    }
  };

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      jobs: [],
      scheduledJobs: []
    };
  }

  componentDidMount() {
    this.getJobs();
    this.getScheduledJobs();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.JOB.NEW, this.newJob);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.JOB.UPDATED, this.jobUpdated);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.JOB.NEW, this.newJob);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.JOB.UPDATED, this.jobUpdated);
  }

  render(props, { jobs, scheduledJobs }) {
    return <SettingsBackgroundJobs jobs={jobs} scheduledJobs={scheduledJobs} user={props.user} />;
  }
}

export default connect('httpClient,session,user', actions)(SettingsSystem);
