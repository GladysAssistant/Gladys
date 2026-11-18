import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';

import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';
import { RequestStatus } from '../../../../../utils/consts';
import getZ2mUrl from '../utils/getZ2mUrl';
import Zigbee2mqttPage from '../Zigbee2mqttPage';
import { MQTT_MODE, isConfigured } from './constants';
import SetupTab from './SetupTab';
import Wizard from './wizard/Wizard';

// Refused while an installation or another operation on the integration runs (see refuseWhileInstalling on the
// server), not because of a container of the user carrying the name of ours, which waiting does not solve
const isBusyRefusal = e =>
  get(e, 'response.status') === 409 &&
  / while (an installation is running|the integration is busy)$/.test(get(e, 'response.data.error'));

const VARIABLE_MAP = {
  ZIGBEE2MQTT_DRIVER_PATH: 'z2mDriverPath',
  ZIGBEE_DONGLE_NAME: 'z2mDongleName',
  Z2M_TCP_PORT: 'z2mTcpPort',
  Z2M_ADAPTER_MODE: 'z2mAdapterMode',
  Z2M_NETWORK_ADAPTER_URL: 'z2mNetworkAdapterUrl',
  Z2M_NETWORK_ADAPTER_TYPE: 'z2mNetworkAdapterType',
  Z2M_MQTT_MODE: 'mqttMode',
  Z2M_MQTT_URL: 'mqttUrl',
  GLADYS_MQTT_USERNAME: 'mqttUsername',
  GLADYS_MQTT_PASSWORD: 'mqttPassword',
  Z2M_FRONTEND_URL: 'z2mFrontendUrl'
};

class Zigbee2mqttSetupPage extends Component {
  resolveZ2mUrl = configuration => getZ2mUrl(configuration, this.props.session.gatewayClient !== undefined);

  handleZ2MStatus = zigbee2mqttStatus => {
    this.progressMessages += 1;
    this.statusMessages += 1;
    // Gladys switched Zigbee2mqtt to the ezsp driver by itself: the saved model changed
    if (zigbee2mqttStatus.ezspFallback && !this.state.zigbee2mqttStatus.ezspFallback) {
      this.loadZ2MConfig();
    }
    this.setState({ zigbee2mqttStatus });
  };

  // Sent apart from the status, which carries them too, to follow an installation without flooding the status
  handleInstallProgress = ({ installation, prefetch }) => {
    this.progressMessages += 1;
    // From the state with the status received just before, which this.state may not hold yet
    this.setState(state => ({ zigbee2mqttStatus: { ...state.zigbee2mqttStatus, installation, prefetch } }));
  };

  // The setup answered before the server saved the port of the interface and the generated MQTT credentials, and
  // the configuration can be saved again
  handleInstallationEnd = installationState => {
    this.loadZ2MConfig();
    // Told until the page is left, or another outcome comes
    if (installationState === 'done') {
      this.setState({ installationFollowedToSuccess: true });
    }
    // The installation that refused them is over
    ['setupZigee2mqttStatus', 'toggleZigee2mqttStatus', 'resetZigbee2mqttStatus'].forEach(requestStatus => {
      if (this.state[requestStatus] === RequestStatus.ConflictError) {
        this.setState({ [requestStatus]: null });
      }
    });
  };

  loadZ2MStatus = async () => {
    const { progressMessages, statusMessages } = this;
    try {
      const zigbee2mqttStatus = await this.props.httpClient.get('/api/v1/service/zigbee2mqtt/status');
      if (this.unmounted) {
        return;
      }
      // A status received during the request is more recent as a whole, a missing dongle told by it included
      if (statusMessages !== this.statusMessages) {
        this.setState({ loadZigbee2mqttStatus: RequestStatus.Success });
        return;
      }
      // A message received during the request carried a more recent installation and prefetch
      const outdated = progressMessages !== this.progressMessages;
      const { installation, prefetch } = outdated ? this.state.zigbee2mqttStatus : zigbee2mqttStatus;
      this.setState({
        zigbee2mqttStatus: { ...zigbee2mqttStatus, installation, prefetch },
        loadZigbee2mqttStatus: RequestStatus.Success
      });
    } catch (e) {
      console.error('Failed to load Zigbee2Mqtt service status', e);
      if (!this.unmounted) {
        this.setState({ loadZigbee2mqttStatus: RequestStatus.Error });
      }
    }
  };

  loadZ2MConfig = async () => {
    this.configRequests += 1;
    const configRequest = this.configRequests;
    try {
      const savedConfig = await this.props.httpClient.get('/api/v1/service/zigbee2mqtt/setup');
      // Loaded again or saved during the request: the configuration of the latest is kept
      if (this.unmounted || configRequest !== this.configRequests) {
        return;
      }
      const configuration = {};
      Object.keys(VARIABLE_MAP).forEach(key => (configuration[VARIABLE_MAP[key]] = savedConfig[key]));
      this.setState({
        configuration,
        z2mUrl: this.resolveZ2mUrl(configuration),
        loadZigbee2mqttConfig: RequestStatus.Success,
        // Chosen once: the wizard saves the configuration on its second step and stays until the user leaves it
        wizard: this.state.wizard === null ? !isConfigured(configuration) : this.state.wizard
      });
    } catch (e) {
      console.error('Failed to load Zigbee2Mqtt service config', e);
      if (!this.unmounted && configRequest === this.configRequests) {
        this.setState({ loadZigbee2mqttConfig: RequestStatus.Error });
      }
    }
  };

  // Nothing configured yet: the images are downloaded in the background, so that the installation does not wait for them.
  // Asked by the local mode form once a coordinator is chosen (a dongle preselected counts), not as the page opens: an
  // external broker, or an admin who only looks, downloads nothing. Asked once, when the server tells that it runs in
  // Docker with the host network.
  prefetchImages = async () => {
    const { loadZigbee2mqttStatus, loadZigbee2mqttConfig, configuration, zigbee2mqttStatus } = this.state;
    const { dockerBased, networkModeValid, installation } = zigbee2mqttStatus;
    if (
      this.prefetchRequested ||
      loadZigbee2mqttStatus !== RequestStatus.Success ||
      loadZigbee2mqttConfig !== RequestStatus.Success ||
      configuration.z2mDriverPath ||
      configuration.z2mNetworkAdapterUrl ||
      configuration.mqttMode === MQTT_MODE.EXTERNAL ||
      !dockerBased ||
      !networkModeValid ||
      get(installation, 'state') === 'running'
    ) {
      return;
    }
    this.prefetchRequested = true;
    const { progressMessages } = this;
    try {
      const prefetch = await this.props.httpClient.post('/api/v1/service/zigbee2mqtt/prefetch');
      // A message received during the request carried a more recent prefetch
      if (this.unmounted || progressMessages !== this.progressMessages) {
        return;
      }
      this.setState({ zigbee2mqttStatus: { ...this.state.zigbee2mqttStatus, prefetch } });
    } catch (e) {
      // The installation downloads what is missing anyway
      console.error('Failed to prefetch the Zigbee2mqtt images', e);
    }
  };

  saveConfiguration = async nextConfiguration => {
    this.setState({
      setupZigee2mqttStatus: RequestStatus.Getting,
      setupZigee2mqttError: null
    });
    try {
      const mapping = {};
      Object.keys(VARIABLE_MAP).forEach(key => (mapping[key] = nextConfiguration[VARIABLE_MAP[key]]));
      const { configRequests } = this;
      const savedConfig = await this.props.httpClient.post('/api/v1/service/zigbee2mqtt/setup', mapping);
      // Changed by the server while it answered (an ezsp fallback, the end of the installation): loaded again below
      const changedMeanwhile = configRequests !== this.configRequests;
      // A load still running may have read the configuration before the save
      this.configRequests += 1;
      const configuration = {};
      Object.keys(VARIABLE_MAP).forEach(key => (configuration[VARIABLE_MAP[key]] = savedConfig[key]));
      this.setState({
        configuration,
        z2mUrl: this.resolveZ2mUrl(configuration),
        setupZigee2mqttStatus: RequestStatus.Success
      });
      if (changedMeanwhile && !this.unmounted) {
        this.loadZ2MConfig();
      }
      return true;
    } catch (e) {
      console.error(e);
      if (this.unmounted) {
        return false;
      }
      this.setState({
        // An installation is already running
        setupZigee2mqttStatus: get(e, 'response.status') === 409 ? RequestStatus.ConflictError : RequestStatus.Error,
        // Refused before saving anything, such as a USB dongle that is not plugged in (DONGLE_NOT_FOUND)
        setupZigee2mqttError: get(e, 'response.status') === 400 ? get(e, 'response.data.message') : null
      });
      return false;
    }
  };

  // The wizard is left for the page of the installation
  finishWizard = () => {
    this.setState({ wizard: false });
  };

  toggleZ2M = async enable => {
    this.setState({
      toggleZigee2mqttStatus: RequestStatus.Getting
    });

    try {
      if (enable) {
        await this.props.httpClient.post('/api/v1/service/zigbee2mqtt/connect');
      } else {
        await this.props.httpClient.post('/api/v1/service/zigbee2mqtt/disconnect');
      }
      this.setState({
        toggleZigee2mqttStatus: RequestStatus.Success
      });
      if (enable) {
        await this.loadZ2MConfig();
      }
    } catch (e) {
      console.error(e);
      this.setState({
        toggleZigee2mqttStatus: isBusyRefusal(e) ? RequestStatus.ConflictError : RequestStatus.Error
      });
    }
  };

  resetZ2M = async () => {
    this.setState({
      resetZigbee2mqttStatus: RequestStatus.Getting
    });
    try {
      await this.props.httpClient.post('/api/v1/service/zigbee2mqtt/reset');
      this.setState({
        resetZigbee2mqttStatus: RequestStatus.Success,
        configuration: {},
        z2mUrl: null,
        // Nothing is configured any more: the wizard installs again, without the refusal of a setup made before
        wizard: true,
        setupZigee2mqttStatus: null,
        setupZigee2mqttError: null
      });
      await this.loadZ2MStatus();
      await this.loadZ2MConfig();
    } catch (e) {
      console.error(e);
      this.setState({
        resetZigbee2mqttStatus: isBusyRefusal(e) ? RequestStatus.ConflictError : RequestStatus.Error
      });
    }
  };

  constructor(props) {
    super(props);

    this.state = {
      zigbee2mqttStatus: {},
      loadZigbee2mqttStatus: RequestStatus.Getting,
      loadZigbee2mqttConfig: RequestStatus.Getting,
      // Whether the wizard is shown, chosen once the configuration is loaded (null before)
      wizard: null
    };
    // Websocket messages received with the installation and the prefetch, more recent than an answer to a request
    // sent before them
    this.progressMessages = 0;
    // Statuses received by websocket, more recent than an answer to a request sent before them
    this.statusMessages = 0;
    // Loads of the configuration sent, and saves answered: only the answer of the latest is applied
    this.configRequests = 0;
  }

  async componentDidMount() {
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE, this.handleZ2MStatus);
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.INSTALL_PROGRESS,
      this.handleInstallProgress
    );
    // The configuration is read after the status: a status that tells the end of an installation comes with the
    // configuration saved by it, and a status that tells an installation running is followed by the message of its end
    await this.loadZ2MStatus();
    await this.loadZ2MConfig();
  }

  componentDidUpdate(previousProps, previousState) {
    const previousInstallationState = get(previousState, 'zigbee2mqttStatus.installation.state');
    const installationState = get(this.state, 'zigbee2mqttStatus.installation.state');
    if (previousInstallationState === 'running' && (installationState === 'done' || installationState === 'failed')) {
      this.handleInstallationEnd(installationState);
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      this.handleZ2MStatus
    );
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.INSTALL_PROGRESS,
      this.handleInstallProgress
    );
  }

  render(props, state) {
    return (
      <Zigbee2mqttPage user={props.user}>
        {state.wizard ? (
          <Wizard
            httpClient={props.httpClient}
            session={props.session}
            zigbee2mqttStatus={state.zigbee2mqttStatus}
            loadZigbee2mqttStatus={state.loadZigbee2mqttStatus}
            configuration={state.configuration}
            setupZigee2mqttStatus={state.setupZigee2mqttStatus}
            setupZigee2mqttError={state.setupZigee2mqttError}
            saveConfiguration={this.saveConfiguration}
            prefetchImages={this.prefetchImages}
            finishWizard={this.finishWizard}
          />
        ) : (
          <SetupTab
            {...props}
            {...state}
            saveConfiguration={this.saveConfiguration}
            toggleZ2M={this.toggleZ2M}
            resetZ2M={this.resetZ2M}
            prefetchImages={this.prefetchImages}
          />
        )}
      </Zigbee2mqttPage>
    );
  }
}

export default connect('user,session,httpClient')(Zigbee2mqttSetupPage);
