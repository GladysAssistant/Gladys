import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';

import ExternalIntegrationPage from '../ExternalIntegrationPage';
import DiscoverTab from './DiscoverTab';
import { RequestStatus } from '../../../../../utils/consts';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

class ExternalIntegrationDiscoverPage extends Component {
  getIntegration = async () => {
    try {
      const integration = await this.props.httpClient.get(`/api/v1/external_integration/${this.props.selector}`);
      this.setState({ integration });
    } catch (e) {
      console.error(e);
    }
  };

  getDiscoveredDevices = async () => {
    this.setState({ getDiscoveredDevicesStatus: RequestStatus.Getting });
    try {
      const discoveredDevices = await this.props.httpClient.get(
        `/api/v1/external_integration/${this.props.selector}/discovered_device`
      );
      this.setState({ discoveredDevices, getDiscoveredDevicesStatus: RequestStatus.Success });
    } catch (e) {
      console.error(e);
      this.setState({ getDiscoveredDevicesStatus: RequestStatus.Error });
    }
  };

  scan = async () => {
    this.setState({ scanStatus: RequestStatus.Getting, scanError: null });
    try {
      await this.props.httpClient.post(`/api/v1/external_integration/${this.props.selector}/scan`);
      this.setState({ scanStatus: RequestStatus.Success });
    } catch (e) {
      console.error(e);
      const status = get(e, 'response.status');
      this.setState({
        scanStatus: RequestStatus.Error,
        scanError:
          status === 400
            ? 'integration.externalIntegration.discover.scanErrorDisconnected'
            : 'integration.externalIntegration.discover.scanError'
      });
    }
  };

  createDevice = async index => {
    const discoveredDevice = this.state.discoveredDevices[index];
    const device = { ...discoveredDevice };
    delete device.created;
    await this.props.httpClient.post('/api/v1/device', device);
    await this.getDiscoveredDevices();
  };

  onDiscoveredDevicesUpdated = payload => {
    if (payload && payload.selector === this.props.selector) {
      this.getDiscoveredDevices();
    }
  };

  componentWillMount() {
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DISCOVERED_DEVICES_UPDATED,
      this.onDiscoveredDevicesUpdated
    );
    this.getIntegration();
    this.getDiscoveredDevices();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selector !== this.props.selector) {
      this.getIntegration();
      this.getDiscoveredDevices();
    }
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DISCOVERED_DEVICES_UPDATED,
      this.onDiscoveredDevicesUpdated
    );
  }

  render(props, state) {
    return (
      <ExternalIntegrationPage selector={props.selector} integration={state.integration}>
        <DiscoverTab {...state} scan={this.scan} createDevice={this.createDevice} />
      </ExternalIntegrationPage>
    );
  }
}

export default connect('user,session,httpClient')(ExternalIntegrationDiscoverPage);
