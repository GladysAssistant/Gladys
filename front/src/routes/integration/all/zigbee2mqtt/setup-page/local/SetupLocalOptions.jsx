import { Component } from 'preact';
import { Text, MarkupText, Localizer } from 'preact-i18n';
import get from 'get-value';

import { RequestStatus } from '../../../../../../utils/consts';
import { MQTT_MODE, ADAPTER_MODE } from '../constants';
import Select from 'react-select';
import SubmitConfiguration from '../components/SubmitConfiguration';

class SetupLocalOptions extends Component {
  updateAdapterMode = e => {
    const z2mAdapterMode = e.target.value;
    this.setState({ z2mAdapterMode });
  };

  updateZigbeeDriverPath = option => {
    const z2mDriverPath = get(option, 'value');
    this.setState({ z2mDriverPath });
  };

  updateZigbeeDongleName = option => {
    const z2mDongleName = get(option, 'value');
    const z2mDongleConfigKey = get(option, 'configKey') || null;
    this.setState({ z2mDongleName, z2mDongleConfigKey });
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
      z2mNetworkAdapterType,
      z2mDongleConfigKey: null
    });
    this.props.resetConfiguration();
  };

  loadUsbPorts = async () => {
    this.setState({
      loadUsbPortsStatus: RequestStatus.Getting
    });

    try {
      const rawUsbPorts = await this.props.httpClient.get('/api/v1/service/usb/port');
      // Remove duplicated (dupe /dev/ttyUSB0 seen with Synology systems)
      const usbPortsMap = {};
      rawUsbPorts.forEach(usbPort => {
        const label = [usbPort.comPath, usbPort.comName, usbPort.comVID].filter(Boolean).join(' - ');
        usbPortsMap[usbPort.comPath] = { label, value: usbPort.comPath };
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

  isEmberFirmwareTooOld = () => {
    const { zigbee2mqttStatus = {} } = this.props;
    const { coordinatorFirmware } = zigbee2mqttStatus;
    const { z2mAdapterMode, z2mDongleConfigKey, z2mNetworkAdapterType } = this.state;

    // In network mode the USB dongle model is not selected, the adapter type is chosen directly
    const adapterConfigKey = z2mAdapterMode === ADAPTER_MODE.NETWORK ? z2mNetworkAdapterType : z2mDongleConfigKey;

    if (adapterConfigKey !== 'ember' || !coordinatorFirmware) {
      return false;
    }

    const { majorrel, minorrel } = coordinatorFirmware;
    if (majorrel === undefined || minorrel === undefined) {
      return false;
    }

    return majorrel < 7 || (majorrel === 7 && minorrel < 4);
  };

  buildSelectOption = value => {
    if (value) {
      return { label: value, value };
    }

    return null;
  };

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
      loadUsbPortsStatus: RequestStatus.Getting,
      z2mDongleName,
      z2mDongleConfigKey: null,
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

  componentDidMount() {
    this.loadUsbPorts();
    this.loadZigbeeAdapters();
  }

  render(
    { disabled },
    {
      z2mDriverPath,
      usbPorts,
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
    const emberFirmwareTooOld = this.isEmberFirmwareTooOld();
    const networkMode = z2mAdapterMode === ADAPTER_MODE.NETWORK;
    const saveDisabled = networkMode ? !z2mNetworkAdapterUrl || !z2mNetworkAdapterType : !z2mDriverPath;

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
                  value={this.buildSelectOption(z2mDriverPath)}
                  onChange={this.updateZigbeeDriverPath}
                  options={usbPorts}
                  isLoading={loadUsbPortsStatus === RequestStatus.Getting}
                  placeholder={<Text id="integration.zigbee2mqtt.setup.modes.local.usbDriverPathPlaceholder" />}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>
              <div class="col-1 d-none d-sm-block">
                <button
                  class="btn btn-outline-success ml-auto"
                  onClick={this.loadUsbPorts}
                  disabled={loadUsbPortsStatus === RequestStatus.Getting}
                >
                  <i class="fe fe-refresh-cw" />
                </button>
              </div>
            </div>
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
                  options={zigbeeAdapters}
                  isLoading={loadZigbeeAdaptersStatus === RequestStatus.Getting}
                  placeholder={<Text id="integration.zigbee2mqtt.setup.modes.local.usbDongleNamePlaceholder" />}
                  isClearable
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
                  options={networkAdapterTypes}
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
        {emberFirmwareTooOld && (
          <div class="alert alert-warning">
            <MarkupText id="integration.zigbee2mqtt.setup.modes.local.containerErrors.EZSP_PROTOCOL_VERSION" />
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
