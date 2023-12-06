import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';

import DashboardPage from './DashboardPage';
import GatewayAccountExpired from '../../components/gateway/GatewayAccountExpired';
import actions from '../../actions/dashboard';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../server/utils/constants';
import get from 'get-value';

class Dashboard extends Component {
  toggleDashboardDropdown = () => {
    this.setState(prevState => {
      return { ...prevState, dashboardDropdownOpened: !this.state.dashboardDropdownOpened };
    });
  };

  toggleDefineTabletMode = () => {
    this.setState(prevState => {
      return { ...prevState, defineTabletModeOpened: !this.state.defineTabletModeOpened };
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

  checkIfFullScreenParameterIsHere = () => {
    if (this.props.fullscreen === 'force') {
      try {
        this.switchToFullScreen();
      } catch (e) {
        console.error(e);
      }
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

  switchToFullScreen = () => {
    if (document.documentElement.requestFullscreen) {
      // chrome & firefox
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      // safari
      document.documentElement.webkitRequestFullscreen();
    }
    this.props.setFullScreen(true);
  };

  exitFullScreen = () => {
    if (document.exitFullscreen) {
      // chrome & firefox
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      // safari
      document.webkitExitFullscreen();
    }
    this.props.setFullScreen(false);
  };

  toggleFullScreen = () => {
    const isFullScreen = this.isFullScreen();
    if (!isFullScreen) {
      this.switchToFullScreen();
    } else {
      this.exitFullScreen();
    }
  };

  onFullScreenChange = () => {
    const isFullScreen = this.isFullScreen();
    this.props.setFullScreen(isFullScreen);
  };

  redirectToLocked = () => {
    route(`/locked${window.location.search}`);
  };

  alarmArmed = async () => {
    // Check server side if we are in tablet mode
    try {
      const currentSession = await this.props.httpClient.get('/api/v1/session/tablet_mode');
      if (currentSession.tablet_mode) {
        this.redirectToLocked();
      }
    } catch (e) {
      console.error(e);
      const status = get(e, 'response.status');
      const errorMessageOtherFormat = get(e, 'response.data.message');
      if (status === 401 && errorMessageOtherFormat === 'TABLET_IS_LOCKED') {
        this.redirectToLocked();
      }
    }
  };

  alarmArming = () => {};

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      isGladysPlus: this.props.session.gatewayClient !== undefined,
      dashboardDropdownOpened: false,
      defineTabletModeOpened: false,
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
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ALARM.ARMED, this.alarmArmed);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ALARM.ARMING, this.alarmArming);
    this.checkIfFullScreenParameterIsHere();
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
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ALARM.ARMED, this.alarmArmed);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ALARM.ARMING, this.alarmArming);
  }

  render(
    props,
    {
      isGladysPlus,
      dashboardDropdownOpened,
      defineTabletModeOpened,
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
        defineTabletModeOpened={defineTabletModeOpened}
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
        toggleDefineTabletMode={this.toggleDefineTabletMode}
        fullScreen={props.fullScreen}
        hideExitFullScreenButton={props.fullscreen === 'force'}
        isGladysPlus={isGladysPlus}
      />
    );
  }
}

export default connect(
  'user,session,fullScreen,currentUrl,httpClient,gatewayAccountExpired,tabletMode',
  actions
)(Dashboard);
