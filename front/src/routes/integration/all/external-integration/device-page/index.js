import { Component } from 'preact';
import { connect } from 'unistore/preact';
import update from 'immutability-helper';

import ExternalIntegrationPage from '../ExternalIntegrationPage';
import DeviceTab from './DeviceTab';
import { RequestStatus } from '../../../../../utils/consts';

class ExternalIntegrationDevicePage extends Component {
  getIntegration = async () => {
    try {
      const integration = await this.props.httpClient.get(`/api/v1/external_integration/${this.props.selector}`);
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

  componentWillMount() {
    this.loadData();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.selector !== this.props.selector) {
      this.loadData();
    }
  }

  render(props, state) {
    return (
      <ExternalIntegrationPage selector={props.selector} integration={state.integration}>
        <DeviceTab
          {...state}
          getDevices={this.getDevices}
          updateDeviceField={this.updateDeviceField}
          saveDevice={this.saveDevice}
          deleteDevice={this.deleteDevice}
        />
      </ExternalIntegrationPage>
    );
  }
}

export default connect('user,httpClient')(ExternalIntegrationDevicePage);
