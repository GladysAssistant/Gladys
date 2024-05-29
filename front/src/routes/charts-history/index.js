import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';

import ChartsHistoryPage from './ChartsHistoryPage';
import withIntlAsProp from '../../utils/withIntlAsProp';
import get from 'get-value';

class ChartsHistory extends Component {
  toggleDashboardDropdown = () => {
    this.setState(prevState => {
      return { ...prevState, dashboardDropdownOpened: !this.state.dashboardDropdownOpened };
    });
  };

  closeDashboardDropdown = () => {
    if (this.state.dashboardDropdownOpened) {
      this.setState({
        dashboardDropdownOpened: false
      });
    }
  };

  getDashboards = async () => {
    try {
      await this.setState({
        getDashboardsError: false,
        loading: true
      });
      const dashboards = (await this.props.httpClient.get('/api/v1/dashboard')).filter(
        dashboard => dashboard.type === 'charts-history'
      );
      let currentDashboardSelector;
      if (this.props.dashboardSelector) {
        currentDashboardSelector = this.props.dashboardSelector;
      } else if (dashboards.length > 0) {
        currentDashboardSelector = dashboards[0].selector;
      }
      await this.setState({
        dashboards,
        currentDashboardSelector,
        getDashboardsError: false,
        loading: false
      });
    } catch (e) {
      console.error(e);
      this.setState({ loading: false });
      const status = get(e, 'response.status');
      const errorMessage = get(e, 'response.error_message');
      // in case we are on the gateway (Gladys Plus)
      if (status === 404 && errorMessage === 'NO_INSTANCE_FOUND') {
        this.setState({
          gatewayInstanceNotFound: true
        });
      } else {
        this.setState({
          getDashboardsError: true
        });
      }
    }
  };

  getCurrentDashboard = async () => {
    try {
      await this.setState({ loading: true });
      const currentDashboard = await this.props.httpClient.get(
        `/api/v1/dashboard/${this.state.currentDashboardSelector}`
      );
      this.setState({
        currentDashboard,
        loading: false
      });
    } catch (e) {
      this.setState({
        loading: false
      });
      console.error(e);
    }
  };

  init = async () => {
    await this.getDashboards();
    if (this.state.currentDashboardSelector) {
      await this.getCurrentDashboard();
    }
  };

  redirectToDashboard = () => {
    this.setState({
      dashboardDropdownOpened: false
    });
  };

  editDashboard = () => {
    route(`/dashboard/charts-history/${this.state.currentDashboard.selector}/edit`);
  };

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      dashboardDropdownOpened: false,
      showReorderDashboard: false,
      dashboards: [],
      newSelectedBoxType: {},
      askDeleteDashboard: false
    };
  }

  componentDidMount() {
    this.init();
    document.addEventListener('click', this.closeDashboardDropdown, true);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.currentUrl !== this.props.currentUrl) {
      this.init();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.closeDashboardDropdown, true);
  }

  render(props, { dashboardDropdownOpened, dashboards, currentDashboard, loading }) {
    const dashboardConfigured =
      currentDashboard && currentDashboard.boxes && currentDashboard.boxes[0] && currentDashboard.boxes[0].length > 0;
    const dashboardListEmpty = !(dashboards && dashboards.length > 0);
    const dashboardNotConfigured = !dashboardConfigured;
    return (
      <ChartsHistoryPage
        {...props}
        dashboardDropdownOpened={dashboardDropdownOpened}
        dashboards={dashboards}
        dashboardListEmpty={dashboardListEmpty}
        currentDashboard={currentDashboard}
        loading={loading}
        dashboardNotConfigured={dashboardNotConfigured}
        toggleDashboardDropdown={this.toggleDashboardDropdown}
        redirectToDashboard={this.redirectToDashboard}
        editDashboard={this.editDashboard}
      />
    );
  }
}

export default withIntlAsProp(connect('user,session,devices,currentUrl,httpClient')(ChartsHistory));
