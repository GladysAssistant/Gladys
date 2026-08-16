import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';
import get from 'get-value';

import DuplicateDashboardPage from './DuplicateDashboardPage';
import { RequestStatus } from '../../../utils/consts';
import withIntlAsProp from '../../../utils/withIntlAsProp';

class DuplicateDashboard extends Component {
  goBack = () => {
    route(`/dashboard/${this.props.dashboardSelector}/edit`);
  };

  getSourceDashboard = async () => {
    try {
      const sourceDashboard = await this.props.httpClient.get(`/api/v1/dashboard/${this.props.dashboardSelector}`);
      this.setState({
        sourceDashboard,
        loading: false,
        dashboard: {
          name: get(this.props.intl.dictionary, 'duplicateDashboard.nameAfterCopy').replace(
            '{{name}}',
            sourceDashboard.name
          )
        }
      });
    } catch (e) {
      console.error(e);
      this.setState({
        loading: false,
        duplicateDashboardStatus: RequestStatus.Error
      });
    }
  };

  checkErrors = (name = this.state.dashboard.name) => {
    const duplicateDashboardErrors = {};
    if (!name) {
      duplicateDashboardErrors.name = true;
    }
    this.setState({
      duplicateDashboardErrors
    });
    return Object.keys(duplicateDashboardErrors).length > 0;
  };

  updateDuplicateDashboardName = e => {
    const { value } = e.target;
    this.setState({
      dashboard: {
        name: value
      }
    });
    if (this.state.duplicateDashboardErrors) {
      // setState is asynchronous, so we validate the new value directly
      this.checkErrors(value);
    }
  };

  duplicateDashboard = async e => {
    e.preventDefault();
    // if errored, we don't continue
    if (this.checkErrors()) {
      return;
    }
    this.setState({
      duplicateDashboardStatus: RequestStatus.Getting
    });
    try {
      const duplicatedDashboard = await this.props.httpClient.post(
        `/api/v1/dashboard/${this.props.dashboardSelector}/duplicate`,
        this.state.dashboard
      );
      this.setState({
        duplicateDashboardStatus: RequestStatus.Success
      });
      route(`/dashboard/${duplicatedDashboard.selector}/edit`);
    } catch (e) {
      console.error(e);
      const status = get(e, 'response.status');
      if (status === 409) {
        this.setState({
          duplicateDashboardStatus: RequestStatus.ConflictError
        });
      } else {
        this.setState({
          duplicateDashboardStatus: RequestStatus.Error
        });
      }
    }
  };

  constructor(props) {
    super(props);
    this.state = {
      dashboard: {
        name: ''
      },
      sourceDashboard: {
        name: ''
      },
      loading: true,
      duplicateDashboardErrors: null,
      duplicateDashboardStatus: null
    };
  }

  componentDidMount() {
    this.getSourceDashboard();
  }

  render(props, { dashboard, sourceDashboard, loading, duplicateDashboardErrors, duplicateDashboardStatus }) {
    return (
      <DuplicateDashboardPage
        {...props}
        goBack={this.goBack}
        dashboard={dashboard}
        sourceDashboard={sourceDashboard}
        loading={loading}
        updateDuplicateDashboardName={this.updateDuplicateDashboardName}
        duplicateDashboard={this.duplicateDashboard}
        duplicateDashboardErrors={duplicateDashboardErrors}
        duplicateDashboardStatus={duplicateDashboardStatus}
      />
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(DuplicateDashboard));
