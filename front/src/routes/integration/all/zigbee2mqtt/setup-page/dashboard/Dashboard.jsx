import { Component } from 'preact';
import { Text } from 'preact-i18n';
import get from 'get-value';

import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../../server/utils/constants';
import { RequestStatus } from '../../../../../../utils/consts';
import { findAdapter } from '../wizard/adapters';
import Wizard from '../wizard/Wizard';
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
import style from './dashboard.css';

const SCREEN = { MAIN: 'main', ADVANCED: 'advanced', CHANGE: 'change' };

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

  handlePermitJoin = permitJoin => this.setState({ permitJoinAllowed: Boolean(permitJoin) });

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
  // any more: it is the past.
  runAction = async (action, body, onSuccess) => {
    this.setState({
      actionStatus: RequestStatus.Getting,
      actionError: null,
      pendingAction: action,
      installationSuccessDismissed: true
    });
    try {
      await this.props.httpClient.post(`/api/v1/service/zigbee2mqtt/${action}`, body);
      if (this.unmounted) {
        return;
      }
      this.setState({ actionStatus: RequestStatus.Success, pendingAction: null, ...(onSuccess || {}) });
    } catch (e) {
      console.error(e);
      if (!this.unmounted) {
        // Refused while an installation or another operation runs: to try again once it ends
        const busy = get(e, 'response.status') === 409;
        this.setState({ actionStatus: RequestStatus.Error, actionError: busy ? 'busy' : 'error', pendingAction: null });
      }
    }
  };

  pair = () => this.runAction('permit_join', { value: true }, { permitJoinAllowed: true });

  start = () => this.runAction('start');

  restart = () => this.runAction('restart');

  askStop = () => this.setState({ confirmStop: true });

  cancelStop = () => this.setState({ confirmStop: false });

  stop = () => this.runAction('stop', undefined, { confirmStop: false });

  showMain = () => this.setState({ screen: SCREEN.MAIN });

  showAdvanced = () => this.setState({ screen: SCREEN.ADVANCED, actionError: null });

  changeKey = () => this.setState({ screen: SCREEN.CHANGE, actionError: null });

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

  noop = () => {};

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
      permitJoinAllowed: false,
      newDeviceCount: null,
      adapters: []
    };
    // Numbers the requests of the discovered devices: only the answer of the last one, or a newer message, counts
    this.discoveredRequests = 0;
  }

  componentDidMount() {
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.DISCOVER, this.handleDiscover);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN, this.handlePermitJoin);
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

  componentDidUpdate(previousProps) {
    const wasInstalling = get(previousProps, 'zigbee2mqttStatus.installation.state') === 'running';
    const installing = get(this.props, 'zigbee2mqttStatus.installation.state') === 'running';
    if (wasInstalling && !installing) {
      this.clearBusyError();
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
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
      this.handlePermitJoin
    );
  }

  render(props, state) {
    const status = props.zigbee2mqttStatus;
    const configuration = props.configuration || {};
    if (state.screen === SCREEN.CHANGE) {
      return (
        <Wizard
          changeMode
          onCancel={this.showMain}
          onChanged={this.showMain}
          httpClient={props.httpClient}
          zigbee2mqttStatus={status}
          configuration={configuration}
          setupZigee2mqttStatus={props.setupZigee2mqttStatus}
          setupZigee2mqttError={props.setupZigee2mqttError}
          saveConfiguration={props.saveConfiguration}
          prefetchImages={props.prefetchImages}
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
      state: dashboardState,
      status,
      configuration,
      savedAdapter,
      z2mUrl,
      language: get(props, 'user.language'),
      installing: dashboardState === DASHBOARD_STATE.INSTALLING,
      primaryAction: getPrimaryAction(dashboardState, configuration),
      tiles: getTiles(dashboardState, configuration, z2mUrl),
      canChangeKey: !isExternal(configuration),
      ezspDriver: !isExternal(configuration) && getDriver(configuration, savedAdapter) === 'ezsp',
      installationSucceeded:
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
      reset: props.resetZ2M,
      noop: this.noop
    };
    if (state.screen === SCREEN.ADVANCED) {
      return <AdvancedSettings view={view} actions={actions} />;
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

export default Dashboard;
