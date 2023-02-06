import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';

import DashboardPage from './DashboardPage';
import GatewayAccountExpired from '../../components/gateway/GatewayAccountExpired';
import get from 'get-value';

class Dashboard extends Component {
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
      const dashboards = await this.props.httpClient.get('/api/v1/dashboard');
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
    route(`/dashboard/${this.state.currentDashboard.selector}/edit`);
  };

  isBrowserFullScreenCompatible = () => {
    return document.fullscreenEnabled || document.webkitFullscreenEnabled;
  };

  isFullScreen = () => {
    return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement;
  };

  toggleFullScreen = () => {
    const isFullScreen = this.isFullScreen();
    if (!isFullScreen) {
      if (document.documentElement.requestFullscreen) {
        // chrome & firefox
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        // safari
        document.documentElement.webkitRequestFullscreen();
      }
      this.props.setFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        // chrome & firefox
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        // safari
        document.webkitExitFullscreen();
      }
      this.props.setFullScreen(false);
    }
  };

  onFullScreenChange = () => {
    const isFullScreen = this.isFullScreen();
    this.props.setFullScreen(isFullScreen);
  };

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      dashboardDropdownOpened: false,
      dashboardEditMode: false,
      showReorderDashboard: false,
      browserFullScreenCompatible: this.isBrowserFullScreenCompatible(),
      dashboards: [],
      newSelectedBoxType: {},
      askDeleteDashboard: false
    };
  }

  componentDidMount() {
    this.init();
    document.addEventListener('fullscreenchange', this.onFullScreenChange, false);
    document.addEventListener('webkitfullscreenchange', this.onFullScreenChange, false);
    document.addEventListener('mozfullscreenchange', this.onFullScreenChange, false);
    document.addEventListener('click', this.closeDashboardDropdown, true);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.currentUrl !== this.props.currentUrl) {
      this.init();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('fullscreenchange', this.onFullScreenChange, false);
    document.removeEventListener('webkitfullscreenchange', this.onFullScreenChange, false);
    document.removeEventListener('mozfullscreenchange', this.onFullScreenChange, false);
    document.removeEventListener('click', this.closeDashboardDropdown, true);
  }

  render(
    props,
    {
      dashboardDropdownOpened,
      dashboards,
      currentDashboard,
      dashboardEditMode,
      gatewayInstanceNotFound,
      loading,
      browserFullScreenCompatible
    }
  ) {
    const dashboardConfigured =
      currentDashboard &&
      currentDashboard.boxes &&
      ((currentDashboard.boxes[0] && currentDashboard.boxes[0].length > 0) ||
        (currentDashboard.boxes[1] && currentDashboard.boxes[1].length > 0) ||
        (currentDashboard.boxes[2] && currentDashboard.boxes[2].length > 0));
    const dashboardListEmpty = !(dashboards && dashboards.length > 0);
    const dashboardNotConfigured = !dashboardConfigured;
    if (props.gatewayAccountExpired === true) {
      return <GatewayAccountExpired />;
    }
    return (
      <DashboardPage
        {...props}
        dashboardDropdownOpened={dashboardDropdownOpened}
        dashboardEditMode={dashboardEditMode}
        dashboards={dashboards}
        dashboardListEmpty={dashboardListEmpty}
        currentDashboard={currentDashboard}
        gatewayInstanceNotFound={gatewayInstanceNotFound}
        loading={loading}
        dashboardNotConfigured={dashboardNotConfigured}
        browserFullScreenCompatible={browserFullScreenCompatible}
        toggleDashboardDropdown={this.toggleDashboardDropdown}
        redirectToDashboard={this.redirectToDashboard}
        editDashboard={this.editDashboard}
        toggleFullScreen={this.toggleFullScreen}
        fullScreen={props.fullScreen}
      />
    );
  }
}

export default connect('user,fullScreen,currentUrl,httpClient,gatewayAccountExpired', {})(Dashboard);
