import { Component } from 'preact';
import { Text } from 'preact-i18n';
import get from 'get-value';

import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../../server/utils/constants';
import { RequestStatus } from '../../../../../../utils/consts';
import withMobileViewport from '../../../../../../components/mobile/MobileViewport';
import { findAdapter } from '../wizard/adapters';
import Wizard from '../wizard/Wizard';
import PairingScreen from '../pairing/PairingScreen';
import {
  DASHBOARD_STATE,
  countNewDevices,
  getDashboardState,
  getPrimaryAction,
  getTiles,
  isExternal
} from './dashboardState';
import StatusCard from './StatusCard';
import KeyCard, { getDriver } from './KeyCard';
import ActionTiles from './ActionTiles';
import AdvancedSettings from './AdvancedSettings';
import DashboardMobile from './DashboardMobile';
import style from './dashboard.css';

const SCREEN = { MAIN: 'main', ADVANCED: 'advanced', CHANGE: 'change', PAIR: 'pair' };

// Under /api/v1/service/zigbee2mqtt/: the stop, start and restart of the integration under run/ (start and stop are
// the routes of the core that Settings > Services calls)
const ACTION_PATHS = {
  stop: 'run/stop',
  start: 'run/start',
  restart: 'run/restart'
};

/**
 * @description The setup page of a configured installation (docs/specs/zigbee2mqtt-installation.md, N): its state and
 * the action to take, its coordinator, restart / stop / start, and the advanced settings on a screen of their own. A
 * change of dongle goes through the first step of the wizard. The status and the configuration come from the page.
 */
class Dashboard extends Component {
  // The page shows the devices of the network not added to Gladys yet, as the Discover tab lists them
  loadNewDevices = async () => {
    this.discoveredRequests += 1;
    const request = this.discoveredRequests;
    try {
      const devices = await this.props.httpClient.get('/api/v1/service/zigbee2mqtt/discovered', {
        filter_existing: false
      });
      if (!this.unmounted && request === this.discoveredRequests) {
        this.setState({ newDeviceCount: countNewDevices(devices) });
      }
    } catch (e) {
      console.error('Failed to load the Zigbee2mqtt devices', e);
    }
  };

  handleDiscover = devices => {
    // More recent than a request still running
    this.discoveredRequests += 1;
    this.setState({ newDeviceCount: countNewDevices(devices) });
  };

  loadAdapters = async () => {
    try {
      const adapters = await this.props.httpClient.get('/api/v1/service/zigbee2mqtt/adapter');
      if (!this.unmounted) {
        this.setState({ adapters });
      }
    } catch (e) {
      // The coordinator is then shown by its label
      console.error('Failed to load Zigbee adapters', e);
    }
  };

  // POST an action; the status the server sends tells its outcome. The success of the last installation is not told
  // any more: it is the past. onSuccess: the changes of a success, or a function giving them once the request answers.
  runAction = async (action, body, onSuccess) => {
    this.setState({
      actionStatus: RequestStatus.Getting,
      actionError: null,
      pendingAction: action,
      installationSuccessDismissed: true
    });
    try {
      await this.props.httpClient.post(`/api/v1/service/zigbee2mqtt/${ACTION_PATHS[action]}`, body);
      if (this.unmounted) {
        return;
      }
      const changes = typeof onSuccess === 'function' ? onSuccess() : onSuccess;
      this.setState({ actionStatus: RequestStatus.Success, pendingAction: null, ...(changes || {}) });
    } catch (e) {
      console.error(e);
      if (!this.unmounted) {
        // Refused while an installation or another operation runs: to try again once it ends
        const busy = get(e, 'response.status') === 409;
        this.setState({ actionStatus: RequestStatus.Error, actionError: busy ? 'busy' : 'error', pendingAction: null });
      }
    }
  };

  // The pairing window, which asks Zigbee2mqtt to permit joining (docs/specs/zigbee2mqtt-pairing.md, D)
  pair = () => this.setState({ screen: SCREEN.PAIR, actionError: null, confirmStop: false });

  start = () => this.runAction('start');

  restart = () => this.runAction('restart');

  askStop = () => this.setState({ confirmStop: true });

  cancelStop = () => this.setState({ confirmStop: false });

  stop = () => this.runAction('stop', undefined, { confirmStop: false });

  showMain = () => this.setState({ screen: SCREEN.MAIN });

  // Back from the pairing window: the devices it added are no longer to add
  closePairing = () => {
    this.showMain();
    if (this.props.zigbee2mqttStatus.zigbee2mqttConnected) {
      this.loadNewDevices();
    }
  };

  // The connection to an external broker out of reach: its fields are in the advanced settings
  editConnection = () => this.showAdvanced();

  // Another screen: a stop not confirmed is given up
  showAdvanced = () => this.setState({ screen: SCREEN.ADVANCED, actionError: null, confirmStop: false });

  changeKey = () => this.setState({ screen: SCREEN.CHANGE, actionError: null, confirmStop: false });

  // A partial setup: only the port of the interface changes, the installation recreates the container
  savePort = async port => {
    const saved = await this.props.saveConfiguration({ z2mTcpPort: port });
    if (saved && !this.unmounted) {
      this.showMain();
    }
  };

  saveBroker = async configuration => {
    const saved = await this.props.saveConfiguration(configuration);
    if (saved && !this.unmounted) {
      this.showMain();
    }
  };

  constructor(props) {
    super(props);
    this.state = {
      screen: SCREEN.MAIN,
      actionStatus: null,
      actionError: null,
      confirmStop: false,
      // The action whose request runs
      pendingAction: null,
      installationSuccessDismissed: false,
      newDeviceCount: null,
      adapters: []
    };
    // Numbers the requests of the discovered devices: only the answer of the last one, or a newer message, counts
    this.discoveredRequests = 0;
  }

  componentDidMount() {
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.DISCOVER, this.handleDiscover);
    this.loadAdapters();
    if (this.props.zigbee2mqttStatus.zigbee2mqttConnected) {
      this.loadNewDevices();
    }
  }

  // The installation that refused an action is over: it can be tried again
  clearBusyError = () => {
    if (this.state.actionError === 'busy') {
      this.setState({ actionError: null, actionStatus: null });
    }
  };

  // A new installation runs: its outcome is told
  followNewInstallation = () => this.setState({ installationSuccessDismissed: false });

  // Another state of Zigbee2mqtt: the refusal of an action (an installation or another operation was running) no longer
  // describes it
  followNewState = () => {
    // A stop asked on another state: asked again if still wanted
    const changes = { confirmStop: false };
    if (this.state.actionError && this.state.actionStatus !== RequestStatus.Getting) {
      changes.actionError = null;
      changes.actionStatus = null;
    }
    this.setState(changes);
  };

  componentDidUpdate(previousProps) {
    const wasInstalling = get(previousProps, 'zigbee2mqttStatus.installation.state') === 'running';
    const installing = get(this.props, 'zigbee2mqttStatus.installation.state') === 'running';
    if (wasInstalling && !installing) {
      this.clearBusyError();
    }
    const configuration = this.props.configuration || {};
    const previousState = getDashboardState(previousProps.zigbee2mqttStatus, previousProps.configuration || {});
    const currentState = getDashboardState(this.props.zigbee2mqttStatus, configuration);
    if (previousState !== currentState) {
      this.followNewState();
    }
    if (installing && !wasInstalling) {
      this.followNewInstallation();
    }
    // Online again (started, restarted, dongle back): its devices may have changed meanwhile
    if (this.props.zigbee2mqttStatus.zigbee2mqttConnected && !previousProps.zigbee2mqttStatus.zigbee2mqttConnected) {
      this.loadNewDevices();
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.DISCOVER, this.handleDiscover);
  }

  render(props, state) {
    const status = props.zigbee2mqttStatus;
    const configuration = props.configuration || {};
    // The status could not be read: an error instead of a state guessed from nothing (docs/specs/…, J)
    if (props.loadZigbee2mqttStatus === RequestStatus.Error && status.dockerBased === undefined) {
      return (
        <div class="alert alert-danger" data-cy="z2m-dashboard-status-error">
          <Text id="integration.zigbee2mqtt.setup.errorLoadingStatesLabel" />
        </div>
      );
    }
    if (state.screen === SCREEN.CHANGE) {
      return (
        <Wizard
          changeMode
          onCancel={this.showMain}
          onChanged={this.showMain}
          httpClient={props.httpClient}
          session={props.session}
          zigbee2mqttStatus={status}
          configuration={configuration}
          setupZigee2mqttStatus={props.setupZigee2mqttStatus}
          setupZigee2mqttError={props.setupZigee2mqttError}
          saveConfiguration={props.saveConfiguration}
          prefetchImages={props.prefetchImages}
        />
      );
    }
    if (state.screen === SCREEN.PAIR) {
      return (
        <PairingScreen
          isMobile={props.isMobile}
          httpClient={props.httpClient}
          session={props.session}
          online={Boolean(status.zigbee2mqttConnected)}
          brokerConnected={status.gladysConnected}
          onClose={this.closePairing}
          backLabelId="integration.zigbee2mqtt.setupTab"
        />
      );
    }
    // Told stopped by the server before its containers are: stopping until the request answers
    const dashboardState =
      state.pendingAction === 'stop' ? DASHBOARD_STATE.STOPPING : getDashboardState(status, configuration);
    const savedAdapter = findAdapter(state.adapters, configuration.z2mDongleName);
    // In local mode, the port of the interface is chosen, then saved, by the first installation that succeeds: the
    // default one would be wrong until then
    const z2mUrl = isExternal(configuration) || configuration.z2mTcpPort ? props.z2mUrl : null;
    const view = {
      ...state,
      isMobile: props.isMobile,
      state: dashboardState,
      status,
      configuration,
      savedAdapter,
      z2mUrl,
      language: get(props, 'user.language'),
      installing: dashboardState === DASHBOARD_STATE.INSTALLING,
      // Step ① needs what init tells of the machine: unknown (null) while the service never started since Gladys did
      changeKeyDisabled:
        dashboardState === DASHBOARD_STATE.INSTALLING || status.configured === null || status.serviceStarted === false,
      // Nothing is saved while the service is not started: the server refuses it (Settings > Services starts it)
      serviceNotStarted: status.serviceStarted === false,
      primaryAction: getPrimaryAction(dashboardState, configuration),
      tiles: getTiles(dashboardState, configuration, z2mUrl, status),
      // The link of Gladys gives its password to the interface, which still asks for it the first time it opens in a
      // browser: said next to the link
      interfaceAsksPassword: !isExternal(configuration) && Boolean(configuration.z2mFrontendAuthToken),
      canChangeKey: !isExternal(configuration),
      ezspDriver: !isExternal(configuration) && getDriver(configuration, savedAdapter) === 'ezsp',
      // Nothing is installed with an external broker: its state tells that Gladys is connected
      installationSucceeded:
        !isExternal(configuration) &&
        Boolean(props.installationFollowedToSuccess) &&
        !state.installationSuccessDismissed &&
        get(status, 'installation.state') === 'done',
      saving: props.setupZigee2mqttStatus === RequestStatus.Getting,
      setupZigee2mqttStatus: props.setupZigee2mqttStatus,
      setupZigee2mqttError: props.setupZigee2mqttError,
      resetZigbee2mqttStatus: props.resetZigbee2mqttStatus
    };
    const actions = {
      pair: this.pair,
      editConnection: this.editConnection,
      start: this.start,
      restart: this.restart,
      askStop: this.askStop,
      cancelStop: this.cancelStop,
      stop: this.stop,
      changeKey: this.changeKey,
      showMain: this.showMain,
      showAdvanced: this.showAdvanced,
      savePort: this.savePort,
      saveBroker: this.saveBroker,
      reset: props.resetZ2M
    };
    if (state.screen === SCREEN.ADVANCED) {
      return <AdvancedSettings view={view} actions={actions} />;
    }
    if (props.isMobile) {
      return <DashboardMobile view={view} actions={actions} />;
    }
    return (
      <div class={style.dashboard} data-cy="z2m-dashboard">
        <div class={style.grid}>
          <div class={style.column}>
            <StatusCard view={view} actions={actions} />
            <KeyCard view={view} actions={actions} />
          </div>
          <div class={style.column}>
            <ActionTiles view={view} actions={actions} />
            <button
              type="button"
              class={style.advancedRow}
              onClick={this.showAdvanced}
              data-cy="z2m-dashboard-advanced-link"
            >
              <span>
                <i class="fe fe-sliders mr-2" aria-hidden="true" />
                <Text id="integration.zigbee2mqtt.setup.dashboard.advanced.title" />
              </span>
              <i class="fe fe-chevron-right" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default withMobileViewport(Dashboard);
