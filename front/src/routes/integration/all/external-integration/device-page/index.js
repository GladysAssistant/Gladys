import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';
import update from 'immutability-helper';
import get from 'get-value';

import ExternalIntegrationPage from '../ExternalIntegrationPage';
import DeviceTab from './DeviceTab';
import { RequestStatus } from '../../../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

class ExternalIntegrationDevicePage extends Component {
  getIntegration = async () => {
    try {
      const integration = await this.props.httpClient.get(`/api/v1/external_integration/${this.props.selector}`);
      // a communication integration has no device screens: direct URL
      // access lands on the configuration screen instead
      if (get(integration, 'manifest.type') === 'communication') {
        route(`/dashboard/integration/device/external/${this.props.selector}/config`, true);
        return;
      }
      this.setState({ integration });
    } catch (e) {
      console.error(e);
    }
  };

  getDevices = async () => {
    this.setState({ getDevicesStatus: RequestStatus.Getting });
    try {
      const devices = await this.props.httpClient.get(`/api/v1/service/${this.props.selector}/device`);
      this.setState({ devices, getDevicesStatus: RequestStatus.Success });
    } catch (e) {
      console.error(e);
      this.setState({ getDevicesStatus: RequestStatus.Error });
    }
  };

  getHouses = async () => {
    try {
      const houses = await this.props.httpClient.get('/api/v1/house', { expand: 'rooms' });
      this.setState({ houses });
    } catch (e) {
      console.error(e);
    }
  };

  updateDeviceField = (index, field, value) => {
    const devices = update(this.state.devices, {
      [index]: {
        [field]: {
          $set: value
        }
      }
    });
    this.setState({ devices });
  };

  saveDevice = async index => {
    const device = this.state.devices[index];
    const savedDevice = await this.props.httpClient.post('/api/v1/device', device);
    const devices = update(this.state.devices, {
      $splice: [[index, 1, savedDevice]]
    });
    this.setState({ devices });
  };

  deleteDevice = async index => {
    const device = this.state.devices[index];
    if (device.created_at) {
      await this.props.httpClient.delete(`/api/v1/device/${device.selector}`);
    }
    const devices = update(this.state.devices, {
      $splice: [[index, 1]]
    });
    this.setState({ devices });
  };

  loadData = () => {
    this.getIntegration();
    this.getDevices();
    this.getHouses();
  };

  onDeviceTransportUpdated = payload => {
    if (!payload || payload.selector !== this.props.selector || !this.state.devices) {
      return;
    }
    // patch the GLADYS_TRANSPORT* params of the concerned devices in
    // place: the badges (and the degraded orange dot) update without
    // refetching the list
    const TRANSPORT_PARAM_NAMES = ['GLADYS_TRANSPORT', 'GLADYS_TRANSPORT_DEGRADED', 'GLADYS_TRANSPORT_MESSAGE'];
    const entryByExternalId = {};
    (payload.transports || []).forEach(entry => {
      entryByExternalId[entry.device_external_id] = entry;
    });
    const devices = this.state.devices.map(device => {
      const entry = entryByExternalId[device.external_id];
      if (!entry) {
        return device;
      }
      const params = (device.params || []).filter(param => !TRANSPORT_PARAM_NAMES.includes(param.name));
      params.push({ name: 'GLADYS_TRANSPORT', value: entry.transport });
      if (entry.degraded) {
        params.push({ name: 'GLADYS_TRANSPORT_DEGRADED', value: 'true' });
        if (entry.message) {
          params.push({ name: 'GLADYS_TRANSPORT_MESSAGE', value: JSON.stringify(entry.message) });
        }
      }
      return { ...device, params };
    });
    this.setState({ devices });
  };

  componentWillMount() {
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_TRANSPORT_UPDATED,
      this.onDeviceTransportUpdated
    );
    this.loadData();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selector !== this.props.selector) {
      this.loadData();
    }
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DEVICE_TRANSPORT_UPDATED,
      this.onDeviceTransportUpdated
    );
  }

  render(props, state) {
    return (
      <ExternalIntegrationPage selector={props.selector} integration={state.integration}>
        <DeviceTab
          {...state}
          language={(props.user && props.user.language) || 'en'}
          getDevices={this.getDevices}
          updateDeviceField={this.updateDeviceField}
          saveDevice={this.saveDevice}
          deleteDevice={this.deleteDevice}
        />
      </ExternalIntegrationPage>
    );
  }
}

export default connect('user,session,httpClient')(ExternalIntegrationDevicePage);
