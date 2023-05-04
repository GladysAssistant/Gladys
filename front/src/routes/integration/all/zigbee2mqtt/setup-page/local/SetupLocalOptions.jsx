import { Component } from 'preact';
import { Text } from 'preact-i18n';
import get from 'get-value';

import { RequestStatus } from '../../../../../../utils/consts';
import Select from 'react-select';

class SetupLocalOptions extends Component {
  updateZigbeeDriverPath = option => {
    const z2mDriverPath = get(option, 'value');
    this.setState({ z2mDriverPath });
  };

  updateZigbeeDongleName = option => {
    const z2mDongleName = get(option, 'value');
    this.setState({ z2mDongleName });
  };

  saveConfiguration = () => {
    const { z2mDriverPath, z2mDongleName } = this.state;
    this.props.saveConfiguration({ z2mDriverPath, z2mDongleName });
  };

  resetConfiguration = () => {
    this.props.disableEditionMode();
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
      const zigbeeAdapterLabels = await this.props.httpClient.get('/api/v1/service/zigbee2mqtt/adapter');
      const zigbeeAdapters = zigbeeAdapterLabels.map(adapter => ({
        label: adapter,
        value: adapter
      }));

      this.setState({
        zigbeeAdapters,
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

  constructor(props) {
    super(props);

    const { configuration } = props;
    const { z2mDriverPath, z2mDongleName } = configuration;

    this.state = {
      z2mDriverPath,
      usbPorts: [],
      loadUsbPortsStatus: RequestStatus.Getting,
      z2mDongleName,
      zigbeeAdapters: [],
      loadZigbeeAdaptersStatus: RequestStatus.Getting
    };
  }

  componentDidMount() {
    this.loadUsbPorts();
    this.loadZigbeeAdapters();
  }

  render({}, { z2mDriverPath, usbPorts, loadUsbPortsStatus, z2mDongleName, zigbeeAdapters, loadZigbeeAdaptersStatus }) {
    return (
      <div>
        <p>
          <Text id="integration.zigbee2mqtt.setup.modes.local.detailsDescription" />
        </p>
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
        <div class="form-group d-flex">
          <button
            class="btn btn-success mx-auto"
            onClick={this.saveConfiguration}
            disabled={!z2mDriverPath}
            data-cy="z2m-setup-local-save"
          >
            <i class="fe fe-check mr-2" />
            <Text id="integration.zigbee2mqtt.setup.continueLabel" />
          </button>
          <button class="btn btn-primary mx-auto" onClick={this.resetConfiguration} data-cy="z2m-setup-local-reset">
            <i class="fe fe-rotate-ccw mr-2" />
            <Text id="integration.zigbee2mqtt.setup.resetLabel" />
          </button>
        </div>
      </div>
    );
  }
}

export default SetupLocalOptions;
