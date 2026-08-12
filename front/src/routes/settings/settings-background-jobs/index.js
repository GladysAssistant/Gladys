import { Component } from 'preact';
import { connect } from 'unistore/preact';

import SettingsBackgroundJobs from './SettingsBackgroundJobs';
import actions from '../../../actions/system';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';

const NUMBER_OF_JOBS_PER_PAGE = 15;

class SettingsSystem extends Component {
  /*
   * Function to replace "2023-01-23 14:20:23.594 +00:00" by "2023-01-23T14:20:23.594+00:00"
   * to be Firefox compatible (ISO8601)
   */
  convertGladysDateToISO8601 = gladysDate => {
    return gladysDate.replace(' ', 'T').replace(' ', '');
  };

  getJobs = async page => {
    try {
      const skip = page * NUMBER_OF_JOBS_PER_PAGE;
      const jobs = await this.props.httpClient.get('/api/v1/job', { take: NUMBER_OF_JOBS_PER_PAGE, skip });

      jobs.forEach(job => (job.created_at = this.convertGladysDateToISO8601(job.created_at)));

      this.setState({
        jobs,
        isFirstPage: page === 0,
        isLastPage: jobs.length < NUMBER_OF_JOBS_PER_PAGE,
        currentPage: page
      });
    } catch (e) {
      console.error(e);
    }
  };

  loadNextPage = async () => {
    const { currentPage } = this.state;
    this.getJobs(currentPage + 1);
  };

  loadPreviousPage = async () => {
    const { currentPage } = this.state;
    this.getJobs(currentPage - 1);
  };

  search = async e => {
    const text = e.target.value;
    await this.setState({
      search: text
    });
    this.getJobs(0);
  };

  newJob = payload => {
    const { jobs, currentPage } = this.state;
    // only add jobs to page if we are at the first page
    if (currentPage === 0) {
      payload.created_at = this.convertGladysDateToISO8601(payload.created_at);
      jobs.unshift(payload);
      this.setState({
        jobs
      });
    }
  };

  jobUpdated = payload => {
    const { jobs } = this.state;
    const previousJobIndex = jobs.findIndex(j => j.id === payload.id);
    if (previousJobIndex !== -1) {
      payload.created_at = this.convertGladysDateToISO8601(payload.created_at);
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
      currentPage: 0,
      isFirstPage: true,
      isLastPage: false,
      jobs: []
    };
  }

  componentDidMount() {
    this.getJobs(0);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.JOB.NEW, this.newJob);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.JOB.UPDATED, this.jobUpdated);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.JOB.NEW, this.newJob);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.JOB.UPDATED, this.jobUpdated);
  }

  render(props, { jobs, isFirstPage, isLastPage }) {
    return (
      <SettingsBackgroundJobs
        jobs={jobs}
        user={props.user}
        loadNextPage={this.loadNextPage}
        loadPreviousPage={this.loadPreviousPage}
        isFirstPage={isFirstPage}
        isLastPage={isLastPage}
      />
    );
  }
}

export default connect('httpClient,session,user', actions)(SettingsSystem);
