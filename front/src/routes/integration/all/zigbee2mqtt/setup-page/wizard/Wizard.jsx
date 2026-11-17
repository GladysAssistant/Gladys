import { Component } from 'preact';
import get from 'get-value';

import { RequestStatus } from '../../../../../../utils/consts';
import withMobileViewport from '../../../../../../components/mobile/MobileViewport';
import { MQTT_MODE, ADAPTER_MODE } from '../constants';
import { dedupePorts, findAdapter, getPortPath, isLegacyEzsp, isPluggedPort } from './adapters';
import { STEP, PANE, KEY_SCENARIO, INSTALL_VIEW } from './constants';
import WizardDesktop from './WizardDesktop';
import WizardMobile from './WizardMobile';

// The ports are listed again this often while the dongle is chosen: a dongle plugged in shows up by itself
const USB_PORTS_REFRESH_INTERVAL_IN_MS = 3000;

const trimmed = value => (value || '').trim();

/**
 * @description First installation of Zigbee2mqtt (docs/specs/zigbee2mqtt-installation.md, M): ① the dongle,
 * ② the installation, ③ the network ready, ④ the first device. Holds the logic, a presentation per screen size
 * shows it. The status, the configuration and their saving come from the setup page.
 */
class Wizard extends Component {
  // The scenario of the "detected" pane, from the ports listed
  getKeyScenario = () => {
    const { usbPorts } = this.state;
    const recognized = usbPorts.filter(usbPort => usbPort.adapter);
    if (recognized.length === 1) {
      return KEY_SCENARIO.ONE;
    }
    if (recognized.length > 1) {
      return KEY_SCENARIO.SEVERAL;
    }
    return usbPorts.some(isPluggedPort) ? KEY_SCENARIO.UNKNOWN : KEY_SCENARIO.NONE;
  };

  // The ports offered when the dongle is chosen by hand: the USB devices, every serial port when asked or when there
  // is no USB device (HAT, GPIO)
  getChoosablePorts = () => {
    const { usbPorts, showAllPorts } = this.state;
    const plugged = usbPorts.filter(isPluggedPort);
    return showAllPorts || plugged.length === 0 ? usbPorts : plugged;
  };

  // The dongle and its model, as chosen in the current pane; null fields when not chosen yet
  getUsbSelection = () => {
    const { pane, usbPorts, pickedPath, pickedModel } = this.state;
    const scenario = this.getKeyScenario();
    let usbPort = null;
    let model = pickedModel;
    if (pane === PANE.AUTO && scenario === KEY_SCENARIO.ONE) {
      usbPort = usbPorts.find(port => port.adapter);
      model = usbPort.adapter;
    } else if (pane === PANE.AUTO && scenario === KEY_SCENARIO.SEVERAL) {
      usbPort = usbPorts.find(port => port.adapter && getPortPath(port) === pickedPath) || null;
      model = usbPort && usbPort.adapter;
    } else if (pane === PANE.MANUAL || (pane === PANE.AUTO && scenario === KEY_SCENARIO.UNKNOWN)) {
      const choosablePorts = this.getChoosablePorts();
      usbPort = choosablePorts.find(port => getPortPath(port) === pickedPath) || null;
      // The only USB device plugged in is the one to use
      const plugged = choosablePorts.filter(isPluggedPort);
      if (!usbPort && pickedPath === null && plugged.length === 1) {
        usbPort = plugged[0];
      }
    } else {
      return { usbPort: null, model: null };
    }
    return { usbPort, model: model || null };
  };

  // What "Install" saves, or null while something is missing
  getConfigurationToSave = () => {
    const { pane, networkUrl, networkType, mqttUrl, mqttUsername, mqttPassword, z2mFrontendUrl } = this.state;
    if (pane === PANE.EXTERNAL) {
      return trimmed(mqttUrl)
        ? {
            mqttMode: MQTT_MODE.EXTERNAL,
            mqttUrl: trimmed(mqttUrl),
            mqttUsername: trimmed(mqttUsername) || null,
            mqttPassword: mqttPassword || null,
            z2mFrontendUrl: trimmed(z2mFrontendUrl) || null
          }
        : null;
    }
    const local = { mqttMode: MQTT_MODE.LOCAL, z2mTcpPort: null };
    if (pane === PANE.NETWORK) {
      return trimmed(networkUrl) && networkType
        ? {
            ...local,
            z2mAdapterMode: ADAPTER_MODE.NETWORK,
            z2mNetworkAdapterUrl: trimmed(networkUrl),
            z2mNetworkAdapterType: networkType,
            z2mDriverPath: null,
            z2mDongleName: null
          }
        : null;
    }
    const { usbPort, model } = this.getUsbSelection();
    return usbPort && model
      ? {
          ...local,
          z2mAdapterMode: ADAPTER_MODE.USB,
          z2mDriverPath: getPortPath(usbPort),
          z2mDongleName: model,
          z2mNetworkAdapterUrl: null,
          z2mNetworkAdapterType: null
        }
      : null;
  };

  isInstallable = () => {
    const { dockerBased, networkModeValid } = this.props.zigbee2mqttStatus;
    return Boolean(dockerBased && networkModeValid);
  };

  loadUsbPorts = async () => {
    this.usbPortsRequests += 1;
    const usbPortsRequest = this.usbPortsRequests;
    try {
      const usbPorts = dedupePorts(await this.props.httpClient.get('/api/v1/service/zigbee2mqtt/usb/port'));
      // Answered after a more recent request, or after the wizard is gone
      if (this.unmounted || usbPortsRequest !== this.usbPortsRequests) {
        return;
      }
      const plugged = usbPorts.some(isPluggedPort);
      const nonePlugged =
        this.state.loadUsbPortsStatus === RequestStatus.Success && !this.state.usbPorts.some(isPluggedPort);
      this.setState({
        usbPorts,
        loadUsbPortsStatus: RequestStatus.Success,
        // Plugged in while the wizard waited for it, told until it is unplugged
        justPlugged: plugged && (this.state.justPlugged || nonePlugged)
      });
    } catch (e) {
      console.error('Failed to load USB ports', e);
      // A refresh that fails keeps the ports listed before
      if (
        !this.unmounted &&
        usbPortsRequest === this.usbPortsRequests &&
        this.state.loadUsbPortsStatus !== RequestStatus.Success
      ) {
        this.setState({ loadUsbPortsStatus: RequestStatus.Error });
      }
    }
  };

  // Only while the dongle is chosen
  shouldRefreshUsbPorts = () =>
    this.state.step === STEP.KEY && (this.state.pane === PANE.AUTO || this.state.pane === PANE.MANUAL);

  scheduleUsbPortsRefresh = () => {
    this.usbPortsTimer = setTimeout(async () => {
      if (this.shouldRefreshUsbPorts()) {
        await this.loadUsbPorts();
      }
      if (!this.unmounted) {
        this.scheduleUsbPortsRefresh();
      }
    }, USB_PORTS_REFRESH_INTERVAL_IN_MS);
  };

  loadAdapters = async () => {
    try {
      const adapters = await this.props.httpClient.get('/api/v1/service/zigbee2mqtt/adapter');
      if (!this.unmounted) {
        this.setState({ adapters, loadAdaptersStatus: RequestStatus.Success });
      }
    } catch (e) {
      console.error('Failed to load Zigbee adapters', e);
      if (!this.unmounted) {
        this.setState({ loadAdaptersStatus: RequestStatus.Error });
      }
    }
  };

  showPane = pane => this.setState({ pane });

  showAuto = () => this.showPane(PANE.AUTO);
  showNetwork = () => this.showPane(PANE.NETWORK);
  showExternal = () => this.showPane(PANE.EXTERNAL);

  // Starts from the dongle chosen so far
  showManual = () => {
    const { usbPort, model } = this.getUsbSelection();
    this.setState({
      pane: PANE.MANUAL,
      pickedPath: usbPort ? getPortPath(usbPort) : this.state.pickedPath,
      pickedModel: model
    });
  };

  showAllPorts = () => this.setState({ showAllPorts: true });

  pickPort = pickedPath => this.setState({ pickedPath });

  pickModel = pickedModel => this.setState({ pickedModel });

  updateField = (field, value) => this.setState({ [field]: value });

  // Saves the configuration, which starts the installation. A failure of the request (dongle not plugged in,
  // installation already running) is told on the dongle step.
  startInstallation = async configuration => {
    const { installation } = this.props.zigbee2mqttStatus;
    // Until a new installation shows up, the one in the status is the previous one (failed, before a retry)
    this.setState({ previousInstallation: JSON.stringify(installation || null), saveErrorClosed: false });
    const saved = await this.props.saveConfiguration(configuration);
    if (this.unmounted) {
      return;
    }
    this.setState(saved ? { step: STEP.INSTALL } : { step: STEP.KEY, previousInstallation: undefined });
  };

  install = async () => {
    const configuration = this.getConfigurationToSave();
    if (!configuration) {
      return;
    }
    this.installedConfiguration = configuration;
    await this.startInstallation(configuration);
  };

  retry = () => this.startInstallation(this.installedConfiguration);

  // Back to the dongle, with what was chosen: a recognized dongle that does not answer is often the wrong model
  changeKey = () => {
    if (this.state.pane === PANE.AUTO) {
      this.showManual();
    }
    this.setState({ step: STEP.KEY });
  };

  showPairing = () => this.setState({ step: STEP.PAIR });

  closeSaveError = () => this.setState({ saveErrorClosed: true });

  closePermitJoinError = () => this.setState({ permitJoinStatus: null });

  allowJoining = async () => {
    this.setState({ permitJoinStatus: RequestStatus.Getting });
    try {
      // Allowed even when it already is, never toggled off
      await this.props.httpClient.post('/api/v1/service/zigbee2mqtt/permit_join', { value: true });
      if (!this.unmounted) {
        this.setState({ permitJoinStatus: RequestStatus.Success });
      }
    } catch (e) {
      console.error('Failed to allow devices to join', e);
      if (!this.unmounted) {
        this.setState({ permitJoinStatus: RequestStatus.Error });
      }
    }
  };

  // Where the installation started by the wizard is
  getInstallView = () => {
    const { zigbee2mqttStatus } = this.props;
    const { installation } = zigbee2mqttStatus;
    // Until a new installation replaces it, the one of the status is the previous one (failed, before a retry). An
    // ended installation never comes back the same: its duration differs.
    if (JSON.stringify(installation || null) === this.state.previousInstallation) {
      return INSTALL_VIEW.STARTING;
    }
    const state = get(installation, 'state');
    if (state === 'running') {
      return INSTALL_VIEW.RUNNING;
    }
    if (state === 'done') {
      return INSTALL_VIEW.READY;
    }
    const external = get(this.installedConfiguration, 'mqttMode') === MQTT_MODE.EXTERNAL;
    // A failure is cleared once Zigbee2mqtt answers (restarted by Docker, slower than the window)
    const answered = external ? zigbee2mqttStatus.gladysConnected : zigbee2mqttStatus.zigbee2mqttConnected;
    if (answered) {
      return INSTALL_VIEW.READY;
    }
    // Failed, or cleared by a stop or a reset made elsewhere
    return INSTALL_VIEW.FAILED;
  };

  constructor(props) {
    super(props);
    this.state = {
      step: STEP.KEY,
      pane: PANE.AUTO,
      usbPorts: [],
      loadUsbPortsStatus: RequestStatus.Getting,
      showAllPorts: false,
      justPlugged: false,
      adapters: [],
      loadAdaptersStatus: RequestStatus.Getting,
      // The port of a dongle chosen among several, or by hand, and its model when it is not recognized
      pickedPath: null,
      pickedModel: null,
      networkUrl: '',
      networkType: null,
      mqttUrl: '',
      mqttUsername: '',
      mqttPassword: '',
      z2mFrontendUrl: '',
      // The installation of the status when "Install" was clicked, until a new one replaces it
      previousInstallation: undefined,
      permitJoinStatus: null,
      // The refusal of the setup, closed from the bottom bar of the phone layout
      saveErrorClosed: false
    };
    // Numbers the requests of the USB ports, to keep only the answer of the last one
    this.usbPortsRequests = 0;
    this.usbPortsTimer = null;
    this.installedConfiguration = null;
  }

  async componentDidMount() {
    await Promise.all([this.loadUsbPorts(), this.loadAdapters()]);
    if (!this.unmounted) {
      this.scheduleUsbPortsRefresh();
    }
  }

  componentDidUpdate() {
    const { step, pane } = this.state;
    // A coordinator chosen, or the dongle preselected: the images are downloaded ahead (once, see prefetchImages)
    if (step === STEP.KEY && pane !== PANE.EXTERNAL && this.isInstallable()) {
      const configuration = this.getConfigurationToSave();
      if (configuration || (pane === PANE.NETWORK && trimmed(this.state.networkUrl))) {
        this.props.prefetchImages();
      }
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
    clearTimeout(this.usbPortsTimer);
    this.usbPortsTimer = null;
  }

  render(props, state) {
    const { usbPort, model } = this.getUsbSelection();
    const savedConfiguration = props.configuration || {};
    const external =
      state.step === STEP.KEY ? state.pane === PANE.EXTERNAL : savedConfiguration.mqttMode === MQTT_MODE.EXTERNAL;
    const view = {
      ...state,
      external,
      installable: this.isInstallable(),
      keyScenario: this.getKeyScenario(),
      choosablePorts: this.getChoosablePorts(),
      selectedPort: usbPort,
      selectedAdapter: findAdapter(state.adapters, model),
      selectedModel: model,
      choosableAdapters: state.adapters.filter(adapter => !isLegacyEzsp(adapter)),
      // The dongle saved, for the steps after the first one (the ezsp fallback changes its model)
      savedAdapter: findAdapter(state.adapters, savedConfiguration.z2mDongleName),
      savedConfiguration,
      configurationToSave: this.getConfigurationToSave(),
      installView: state.step === STEP.KEY ? null : this.getInstallView(),
      zigbee2mqttStatus: props.zigbee2mqttStatus,
      configuration: props.configuration,
      saving: props.setupZigee2mqttStatus === RequestStatus.Getting,
      setupZigee2mqttStatus: props.setupZigee2mqttStatus,
      setupZigee2mqttError: props.setupZigee2mqttError
    };
    const actions = {
      showAuto: this.showAuto,
      showManual: this.showManual,
      showNetwork: this.showNetwork,
      showExternal: this.showExternal,
      showAllPorts: this.showAllPorts,
      pickPort: this.pickPort,
      pickModel: this.pickModel,
      updateField: this.updateField,
      install: this.install,
      retry: this.retry,
      changeKey: this.changeKey,
      showPairing: this.showPairing,
      allowJoining: this.allowJoining,
      closeSaveError: this.closeSaveError,
      closePermitJoinError: this.closePermitJoinError,
      finish: props.finishWizard
    };
    return props.isMobile ? (
      <WizardMobile view={view} actions={actions} />
    ) : (
      <WizardDesktop view={view} actions={actions} />
    );
  }
}

export default withMobileViewport(Wizard);
