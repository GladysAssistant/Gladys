import { Text } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import { RequestStatus } from '../../../../../utils/consts';
import DeviceForm from './DeviceForm';

class KodiDeviceBox extends Component {
  saveDevice = async () => {
    this.setState({ loading: true });
    try {
      await this.props.saveDevice(this.props.device, this.props.deviceIndex);
      this.setState({ saveError: null });
    } catch (e) {
      this.setState({ saveError: RequestStatus.Error });
    }
    this.setState({ loading: false });
  };

  deleteDevice = async () => {
    this.setState({ loading: true });
    try {
      await this.props.deleteDevice(this.props.device, this.props.deviceIndex);
      this.setState({ saveError: null });
    } catch (e) {
      this.setState({ saveError: RequestStatus.Error });
    }
    this.setState({ loading: false });
  };

  testConnection = async () => {
    this.setState({
      loading: true
    });
    try {
      await this.props.testConnection(this.props.deviceIndex);
      this.setState({
        testConnectionError: null,
        testConnectionSuccess: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        testConnectionError: RequestStatus.Error,
        testConnectionSuccess: null
      });
    }
    this.setState({
      loading: false
    });
  };

  render(props, { loading, saveError, testConnectionError, testConnectionSuccess }) {
    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">{props.device.name || <Text id="integration.mqtt.device.noNameLabel" />}</div>
          <div
            class={cx('dimmer', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              {saveError && (
                <div class="alert alert-danger">
                  <Text id="integration.kodi.saveError" />
                </div>
              )}
              {testConnectionError && (
                <div class="alert alert-danger">
                  <Text id="integration.kodi.testConnectionError" />
                </div>
              )}
              {testConnectionSuccess && (
                <div class="alert alert-info">
                  <Text id="integration.kodi.testConnectionSuccess" />
                </div>
              )}
              <div class="card-body">
                <DeviceForm {...props} />

                <div class="form-group">
                  <button onClick={this.testConnection} class="btn btn-info mr-2">
                    <Text id="integration.kodi.testConnectionButton" />
                  </button>
                  <button onClick={this.saveDevice} class="btn btn-success mr-2">
                    <Text id="integration.mqtt.device.saveButton" />
                  </button>
                  <button onClick={this.deleteDevice} class="btn btn-danger mr-2">
                    <Text id="integration.mqtt.device.deleteButton" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default KodiDeviceBox;
