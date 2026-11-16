import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import get from 'get-value';

import { RequestStatus } from '../../../../../../utils/consts';
import { MQTT_MODE, ADAPTER_MODE } from '../constants';
import Select from 'react-select';
import SubmitConfiguration from '../components/SubmitConfiguration';
import PrefetchStatus from '../components/PrefetchStatus';

class SetupLocalOptions extends Component {
  updateAdapterMode = e => {
    const z2mAdapterMode = e.target.value;
    this.setState({ z2mAdapterMode });
  };

  updateZigbeeDriverPath = option => {
    const z2mDriverPath = get(option, 'value');
    if (z2mDriverPath === this.state.z2mDriverPath) {
      return;
    }
    // The model follows the dongle of the new port: the recognized one, or none to choose, so that the model
    // of another dongle never stays selected for an unrecognized one
    this.setState({ z2mDriverPath, z2mDongleName: get(option, 'adapter') || null });
  };

  updateZigbeeDongleName = option => {
    const z2mDongleName = get(option, 'value');
    this.setState({ z2mDongleName });
  };

  showAllUsbPorts = () => {
    this.setState({ showAllUsbPorts: true });
  };

  preselectDetectedDongle = () => {
    const { usbPorts, z2mDriverPath, z2mDongleName } = this.state;

    if (!z2mDriverPath) {
      // The only recognized dongle plugged in is the one to use
      const detectedPorts = usbPorts.filter(usbPort => usbPort.adapter);
      if (detectedPorts.length === 1) {
        this.setState({ z2mDriverPath: detectedPorts[0].path, z2mDongleName: detectedPorts[0].adapter });
      }
    } else if (!z2mDongleName) {
      // A port configured without model: suggest the model recognized on it
      const usbPort = usbPorts.find(port => port.path === z2mDriverPath);
      if (usbPort && usbPort.adapter) {
        this.setState({ z2mDongleName: usbPort.adapter });
      }
    }
  };

  refreshUsbPorts = async () => {
    await this.loadUsbPorts();
    this.preselectDetectedDongle();
  };

  updateNetworkAdapterUrl = e => {
    const { value } = e.target;
    const z2mNetworkAdapterUrl = value.trim() === '' ? null : value;
    this.setState({ z2mNetworkAdapterUrl });
  };

  updateNetworkAdapterType = option => {
    const z2mNetworkAdapterType = get(option, 'value');
    this.setState({ z2mNetworkAdapterType });
  };

  updateTcpPort = e => {
    const { value } = e.target;
    const z2mTcpPort = value.trim() === '' ? null : value;
    this.setState({ z2mTcpPort });
  };

  saveConfiguration = () => {
    const {
      z2mAdapterMode,
      z2mDriverPath,
      z2mDongleName,
      z2mNetworkAdapterUrl,
      z2mNetworkAdapterType,
      z2mTcpPort,
      mqttMode
    } = this.state;

    const networkMode = z2mAdapterMode === ADAPTER_MODE.NETWORK;

    this.props.saveConfiguration({
      z2mAdapterMode,
      z2mDriverPath: networkMode ? null : z2mDriverPath,
      z2mDongleName: networkMode ? null : z2mDongleName,
      z2mNetworkAdapterUrl: networkMode ? z2mNetworkAdapterUrl : null,
      z2mNetworkAdapterType: networkMode ? z2mNetworkAdapterType : null,
      z2mTcpPort,
      mqttMode
    });
  };

  resetConfiguration = () => {
    const { configuration } = this.props;
    const {
      z2mDriverPath,
      z2mDongleName,
      z2mTcpPort,
      z2mAdapterMode,
      z2mNetworkAdapterUrl,
      z2mNetworkAdapterType
    } = configuration;

    this.setState({
      z2mDriverPath,
      z2mDongleName,
      z2mTcpPort,
      z2mAdapterMode: z2mAdapterMode || ADAPTER_MODE.USB,
      z2mNetworkAdapterUrl,
      z2mNetworkAdapterType
    });
    this.props.resetConfiguration();
  };

  loadUsbPorts = async () => {
    this.setState({
      loadUsbPortsStatus: RequestStatus.Getting
    });

    try {
      const rawUsbPorts = await this.props.httpClient.get('/api/v1/service/zigbee2mqtt/usb/port');
      // Remove duplicated (dupe /dev/ttyUSB0 seen with Synology systems)
      const usbPortsMap = {};
      rawUsbPorts.forEach(usbPort => {
        usbPortsMap[usbPort.path] = usbPort;
      });
      const usbPorts = Object.values(usbPortsMap);
      this.setState({
        usbPorts,
        loadUsbPortsStatus: RequestStatus.Success
      });
    } catch (e) {
      console.error('Failed to load USB ports', e);
      this.setState({
        loadUsbPortsStatus: RequestStatus.Error
      });
    }
  };

  loadZigbeeAdapters = async () => {
    this.setState({
      loadZigbeeAdaptersStatus: RequestStatus.Getting
    });

    try {
      const adapters = await this.props.httpClient.get('/api/v1/service/zigbee2mqtt/adapter');
      const zigbeeAdapters = adapters.map(adapter => ({
        label: adapter.label,
        value: adapter.label,
        configKey: adapter.configKey
      }));
      // A network coordinator is configured with the Zigbee2mqtt adapter type directly
      const networkAdapterTypes = [...new Set(adapters.map(adapter => adapter.configKey))]
        .sort()
        .map(configKey => ({ label: configKey, value: configKey }));

      this.setState({
        zigbeeAdapters,
        networkAdapterTypes,
        loadZigbeeAdaptersStatus: RequestStatus.Success
      });
    } catch (e) {
      console.error('Failed to load Zigbee adapters', e);
      this.setState({
        loadZigbeeAdaptersStatus: RequestStatus.Error
      });
    }
  };

  buildSelectOption = value => {
    if (value) {
      return { label: value, value };
    }

    return null;
  };

  buildUsbPortOption = usbPort => ({
    label: usbPort.name ? `${usbPort.name} (${usbPort.path})` : usbPort.path,
    value: usbPort.path,
    adapter: usbPort.adapter
  });

  constructor(props) {
    super(props);

    const { configuration } = props;
    const {
      z2mDriverPath,
      z2mDongleName,
      z2mTcpPort,
      z2mAdapterMode,
      z2mNetworkAdapterUrl,
      z2mNetworkAdapterType
    } = configuration;

    this.state = {
      z2mDriverPath,
      usbPorts: [],
      showAllUsbPorts: false,
      loadUsbPortsStatus: RequestStatus.Getting,
      z2mDongleName,
      zigbeeAdapters: [],
      networkAdapterTypes: [],
      loadZigbeeAdaptersStatus: RequestStatus.Getting,
      z2mTcpPort,
      z2mAdapterMode: z2mAdapterMode || ADAPTER_MODE.USB,
      z2mNetworkAdapterUrl,
      z2mNetworkAdapterType,
      mqttMode: MQTT_MODE.LOCAL
    };
  }

  async componentDidMount() {
    await Promise.all([this.loadUsbPorts(), this.loadZigbeeAdapters()]);
    this.preselectDetectedDongle();
  }

  componentDidUpdate() {
    // A coordinator chosen, or the dongle preselected: Zigbee2mqtt is set up on this Gladys, its images can be downloaded
    // ahead. Asked again on each update, as the page waits for the server to tell it runs in Docker (see prefetchImages).
    const { z2mAdapterMode, z2mDriverPath, z2mNetworkAdapterUrl } = this.state;
    const coordinator = z2mAdapterMode === ADAPTER_MODE.NETWORK ? z2mNetworkAdapterUrl : z2mDriverPath;
    if (coordinator) {
      this.props.prefetchImages();
    }
  }

  render(
    { disabled, configuration, zigbee2mqttStatus },
    {
      z2mDriverPath,
      usbPorts,
      showAllUsbPorts,
      loadUsbPortsStatus,
      z2mDongleName,
      zigbeeAdapters,
      networkAdapterTypes,
      loadZigbeeAdaptersStatus,
      z2mTcpPort,
      z2mAdapterMode,
      z2mNetworkAdapterUrl,
      z2mNetworkAdapterType
    }
  ) {
    const networkMode = z2mAdapterMode === ADAPTER_MODE.NETWORK;
    const saveDisabled = networkMode
      ? !z2mNetworkAdapterUrl || !z2mNetworkAdapterType
      : !z2mDriverPath || !z2mDongleName;

    // The serial ports of the machine itself, GPIO HATs included, have no USB device name: hidden, unless no port has one
    // (machine without udev, such as some NAS)
    const hideMachinePorts = !showAllUsbPorts && usbPorts.some(usbPort => usbPort.pnpId);
    const visibleUsbPorts = hideMachinePorts ? usbPorts.filter(usbPort => usbPort.pnpId) : usbPorts;
    const selectedUsbPort = usbPorts.find(usbPort => usbPort.path === z2mDriverPath);
    const selectedUsbPortOption = selectedUsbPort
      ? this.buildUsbPortOption(selectedUsbPort)
      : this.buildSelectOption(z2mDriverPath);
    // The model chosen contradicts the recognized dongle, except its "(legacy ezsp)" variant, for an old firmware
    const recognizedAdapter = get(selectedUsbPort, 'adapter');
    const dongleNameMismatch =
      recognizedAdapter &&
      z2mDongleName &&
      z2mDongleName !== recognizedAdapter &&
      z2mDongleName !== `${recognizedAdapter} (legacy ezsp)`;
    // The ezsp driver only runs a firmware older than 7.4, and Gladys switches to it by itself when the ember driver
    // refuses one: hidden, unless already configured, or the variant of the recognized dongle, kept by hand in case
    // the fallback does not happen
    const dongleOptions = zigbeeAdapters.filter(
      adapter =>
        adapter.configKey !== 'ezsp' ||
        adapter.value === configuration.z2mDongleName ||
        adapter.value === `${recognizedAdapter} (legacy ezsp)`
    );
    const networkAdapterTypeOptions = networkAdapterTypes.filter(
      adapterType => adapterType.value !== 'ezsp' || adapterType.value === configuration.z2mNetworkAdapterType
    );

    return (
      <div>
        <p>
          <Text id="integration.zigbee2mqtt.setup.modes.local.detailsDescription" />
        </p>
        <div class="form-group">
          <label class="form-label">
            <Text id="integration.zigbee2mqtt.setup.modes.local.adapterModeLabel" />
          </label>
          <div data-cy="z2m-setup-local-adapter-mode-field">
            <div class="form-check form-check-inline">
              <label class="custom-control custom-radio">
                <input
                  type="radio"
                  class="custom-control-input"
                  name="z2mAdapterMode"
                  value={ADAPTER_MODE.USB}
                  checked={!networkMode}
                  onChange={this.updateAdapterMode}
                  disabled={disabled}
                />
                <div class="custom-control-label">
                  <Text id="integration.zigbee2mqtt.setup.modes.local.adapterModeUsbLabel" />
                </div>
              </label>
            </div>
            <div class="form-check form-check-inline">
              <label class="custom-control custom-radio">
                <input
                  type="radio"
                  class="custom-control-input"
                  name="z2mAdapterMode"
                  value={ADAPTER_MODE.NETWORK}
                  checked={networkMode}
                  onChange={this.updateAdapterMode}
                  disabled={disabled}
                />
                <div class="custom-control-label">
                  <Text id="integration.zigbee2mqtt.setup.modes.local.adapterModeNetworkLabel" />
                </div>
              </label>
            </div>
          </div>
        </div>
        {!networkMode && (
          <div class="form-group">
            <label class="form-label">
              <Text id="integration.zigbee2mqtt.setup.modes.local.usbDriverPathLabel" />
            </label>
            <div class="row">
              <div class="col" data-cy="z2m-setup-local-usb-field">
                <Select
                  value={selectedUsbPortOption}
                  onChange={this.updateZigbeeDriverPath}
                  options={visibleUsbPorts.map(this.buildUsbPortOption)}
                  isLoading={loadUsbPortsStatus === RequestStatus.Getting}
                  placeholder={<Text id="integration.zigbee2mqtt.setup.modes.local.usbDriverPathPlaceholder" />}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>
              <div class="col-1 d-none d-sm-block">
                <button
                  class="btn btn-outline-success ml-auto"
                  onClick={this.refreshUsbPorts}
                  disabled={loadUsbPortsStatus === RequestStatus.Getting}
                  data-cy="z2m-setup-local-usb-refresh"
                >
                  <i class="fe fe-refresh-cw" />
                </button>
              </div>
            </div>
            {visibleUsbPorts.length < usbPorts.length && (
              <button
                type="button"
                class="btn btn-link btn-sm px-0"
                onClick={this.showAllUsbPorts}
                data-cy="z2m-setup-local-usb-show-all"
              >
                <Text id="integration.zigbee2mqtt.setup.modes.local.usbDriverPathShowAll" />
              </button>
            )}
          </div>
        )}
        {!networkMode && (
          <div class="form-group">
            <label class="form-label">
              <Text id="integration.zigbee2mqtt.setup.modes.local.usbDongleNameLabel" />
            </label>
            <div class="row">
              <div class="col" data-cy="z2m-setup-local-dongle-field">
                <Select
                  value={this.buildSelectOption(z2mDongleName)}
                  onChange={this.updateZigbeeDongleName}
                  options={dongleOptions}
                  isLoading={loadZigbeeAdaptersStatus === RequestStatus.Getting}
                  placeholder={<Text id="integration.zigbee2mqtt.setup.modes.local.usbDongleNamePlaceholder" />}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>
              <div class="col-1 d-none d-sm-block">
                <button
                  class="btn btn-outline-success ml-auto"
                  onClick={this.loadZigbeeAdapters}
                  disabled={loadZigbeeAdaptersStatus === RequestStatus.Getting}
                >
                  <i class="fe fe-refresh-cw" />
                </button>
              </div>
            </div>
            {selectedUsbPort && selectedUsbPort.adapter && selectedUsbPort.adapter === z2mDongleName && (
              <small class="form-text text-muted" data-cy="z2m-setup-local-dongle-detected">
                <Text id="integration.zigbee2mqtt.setup.modes.local.usbDongleNameDetected" />
              </small>
            )}
            {selectedUsbPort && !selectedUsbPort.adapter && !z2mDongleName && (
              <small class="form-text text-muted" data-cy="z2m-setup-local-dongle-not-detected">
                <Text id="integration.zigbee2mqtt.setup.modes.local.usbDongleNameNotDetected" />
              </small>
            )}
            {dongleNameMismatch && (
              <small class="form-text text-warning" data-cy="z2m-setup-local-dongle-mismatch">
                <Text
                  id="integration.zigbee2mqtt.setup.modes.local.usbDongleNameMismatch"
                  fields={{ model: recognizedAdapter }}
                />
              </small>
            )}
          </div>
        )}
        {networkMode && (
          <div class="form-group">
            <label class="form-label" for="z2mNetworkAdapterUrl">
              <Text id="integration.zigbee2mqtt.setup.modes.local.networkAdapterUrlLabel" />
            </label>
            <div class="row">
              <div class="col col-sm-11" data-cy="z2m-setup-local-network-url-field">
                <Localizer>
                  <input
                    id="z2mNetworkAdapterUrl"
                    name="z2mNetworkAdapterUrl"
                    type="text"
                    class="form-control"
                    value={z2mNetworkAdapterUrl}
                    onInput={this.updateNetworkAdapterUrl}
                    placeholder={<Text id="integration.zigbee2mqtt.setup.modes.local.networkAdapterUrlPlaceholder" />}
                  />
                </Localizer>
              </div>
            </div>
            <small class="form-text text-muted">
              <Text id="integration.zigbee2mqtt.setup.modes.local.networkAdapterUrlDescription" />
            </small>
          </div>
        )}
        {networkMode && (
          <div class="form-group">
            <label class="form-label">
              <Text id="integration.zigbee2mqtt.setup.modes.local.networkAdapterTypeLabel" />
            </label>
            <div class="row">
              <div class="col col-sm-11" data-cy="z2m-setup-local-network-type-field">
                <Select
                  value={this.buildSelectOption(z2mNetworkAdapterType)}
                  onChange={this.updateNetworkAdapterType}
                  options={networkAdapterTypeOptions}
                  isLoading={loadZigbeeAdaptersStatus === RequestStatus.Getting}
                  placeholder={<Text id="integration.zigbee2mqtt.setup.modes.local.networkAdapterTypePlaceholder" />}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>
            </div>
            <small class="form-text text-muted">
              <Text id="integration.zigbee2mqtt.setup.modes.local.networkAdapterTypeDescription" />
            </small>
          </div>
        )}
        <div class="form-group">
          <label class="form-label">
            <Text id="integration.zigbee2mqtt.setup.modes.local.z2mTcpPortLabel" />
          </label>
          <div class="row">
            <div class="col col-sm-11" data-cy="z2m-setup-local-tcp-field">
              <input
                type="number"
                class="form-control"
                value={z2mTcpPort}
                onChange={this.updateTcpPort}
                placeholder="8080"
                min="1"
                max="65535"
              />
            </div>
          </div>
          <small class="form-text text-muted">
            <Text id="integration.zigbee2mqtt.setup.modes.local.z2mTcpPortDescription" />
          </small>
        </div>
        <PrefetchStatus configuration={configuration} zigbee2mqttStatus={zigbee2mqttStatus} />
        <SubmitConfiguration
          saveDisabled={saveDisabled}
          disabled={disabled}
          saveConfiguration={this.saveConfiguration}
          resetConfiguration={this.resetConfiguration}
        />
      </div>
    );
  }
}

export default SetupLocalOptions;
