import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';

import DashboardPage from './DashboardPage';
import GatewayAccountExpired from '../../components/gateway/GatewayAccountExpired';
import actions from '../../actions/dashboard';
import { JOB_TYPES, WEBSOCKET_MESSAGE_TYPES } from '../../../../server/utils/constants';
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

  getDuckDbMigrationJob = async () => {
    try {
      const jobs = await this.props.httpClient.get(`/api/v1/job`, {
        type: JOB_TYPES.MIGRATE_SQLITE_TO_DUCKDB,
        take: 1
      });
      if (jobs.length > 0) {
        this.setState({
          duckDbMigrationJob: jobs[0]
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  jobUpdated = payload => {
    const { duckDbMigrationJob } = this.state;
    if (payload.id === duckDbMigrationJob.id) {
      this.setState({ duckDbMigrationJob: payload });
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
      this.storeDashboardConfig(currentDashboard);
    } catch (e) {
      this.setState({
        loading: false
      });
      console.error(e);
    }
  };

  // Every fully-fetched dashboard goes into a config cache keyed by
  // selector. The cache serves two purposes: switching dashboards renders
  // the target instantly from it (the widgets then fetch their own live
  // data) instead of blanking behind a fetch, and the mobile pager draws
  // the NEIGHBORING dashboards as data-less skeletons while a swipe pulls
  // them into view.
  storeDashboardConfig = dashboard => {
    if (!dashboard || !dashboard.selector) {
      return;
    }
    this.setState(prevState => ({
      dashboardConfigsBySelector: {
        ...prevState.dashboardConfigsBySelector,
        [dashboard.selector]: dashboard
      }
    }));
  };

  // Warm the cache with every dashboard's configuration right after the
  // list arrives. These are a handful of small JSON payloads (box layout,
  // no device data), fetched in parallel and never blocking first paint —
  // the price of making every later switch feel native.
  prefetchDashboardConfigs = async () => {
    const { dashboards, currentDashboardSelector } = this.state;
    if (!dashboards || dashboards.length < 2) {
      return;
    }
    await Promise.all(
      dashboards
        .filter(dashboard => dashboard.selector !== currentDashboardSelector)
        .map(async dashboard => {
          try {
            const config = await this.props.httpClient.get(`/api/v1/dashboard/${dashboard.selector}`);
            this.storeDashboardConfig(config);
          } catch (e) {
            console.error(e);
          }
        })
    );
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
    // fire and forget, concurrent with the current dashboard's own fetch:
    // the cache warms behind the visible dashboard, not after it
    this.prefetchDashboardConfigs();
    if (this.state.currentDashboardSelector) {
      await this.getCurrentDashboard();
    }
    await this.getDuckDbMigrationJob();
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
    // eslint-disable-next-line compat/compat
    return document.fullscreenEnabled || document.webkitFullscreenEnabled;
  };

  isFullScreen = () => {
    // eslint-disable-next-line compat/compat
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

  alarmArmedOrPartiallyArmed = async () => {
    // Check server side if we are in tablet mode
    try {
      const currentSession = await this.props.httpClient.get('/api/v1/session/tablet_mode');
      if (currentSession.tablet_mode && currentSession.has_alarm_code) {
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
      dashboardConfigsBySelector: {},
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
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ALARM.ARMED, this.alarmArmedOrPartiallyArmed);
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.ALARM.PARTIALLY_ARMED,
      this.alarmArmedOrPartiallyArmed
    );
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ALARM.ARMING, this.alarmArming);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.JOB.UPDATED, this.jobUpdated);
    this.checkIfFullScreenParameterIsHere();
  }

  // Client-side dashboard switch: the dashboard list is already loaded, and
  // the target's configuration is (almost always) in the cache — so the
  // target renders IMMEDIATELY from it, its widgets fetching their own live
  // data, and only a background refresh checks the config is current. On a
  // cold cache the page keeps showing the previous dashboard until the
  // fetch lands, instead of blanking behind the loading dimmer.
  switchToDashboardFromUrl = async () => {
    const { dashboards, dashboardConfigsBySelector } = this.state;
    if (!dashboards || dashboards.length === 0) {
      return this.init();
    }
    const selector = this.props.dashboardSelector || dashboards[0].selector;
    const cached = dashboardConfigsBySelector[selector];
    await this.setState({
      currentDashboardSelector: selector,
      ...(cached ? { currentDashboard: cached } : {})
    });
    try {
      const currentDashboard = await this.props.httpClient.get(`/api/v1/dashboard/${selector}`);
      this.storeDashboardConfig(currentDashboard);
      // ignore a stale response if the user switched again in the meantime
      if (this.state.currentDashboardSelector === selector) {
        this.setState({ currentDashboard });
      }
    } catch (e) {
      console.error(e);
    }
  };

  componentDidUpdate(prevProps) {
    if (prevProps.currentUrl !== this.props.currentUrl) {
      this.switchToDashboardFromUrl();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('fullscreenchange', this.onFullScreenChange, false);
    document.removeEventListener('webkitfullscreenchange', this.onFullScreenChange, false);
    document.removeEventListener('mozfullscreenchange', this.onFullScreenChange, false);
    document.removeEventListener('click', this.closeDashboardDropdown, true);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ALARM.ARMED, this.alarmArmedOrPartiallyArmed);
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.ALARM.PARTIALLY_ARMED,
      this.alarmArmedOrPartiallyArmed
    );
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ALARM.ARMING, this.alarmArming);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.JOB.UPDATED, this.jobUpdated);
  }

  render(
    props,
    {
      isGladysPlus,
      dashboardDropdownOpened,
      defineTabletModeOpened,
      dashboards,
      dashboardConfigsBySelector,
      currentDashboard,
      dashboardEditMode,
      gatewayInstanceNotFound,
      loading,
      browserFullScreenCompatible,
      duckDbMigrationJob
    }
  ) {
    const dashboardConfigured =
      currentDashboard &&
      currentDashboard.boxes &&
      currentDashboard.boxes.some(section => section.columns && section.columns.some(column => column.length > 0));
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
        dashboardConfigsBySelector={dashboardConfigsBySelector}
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
        duckDbMigrationJob={duckDbMigrationJob}
      />
    );
  }
}

export default connect(
  'user,session,fullScreen,currentUrl,httpClient,gatewayAccountExpired,tabletMode',
  actions
)(Dashboard);
