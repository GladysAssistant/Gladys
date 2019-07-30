import { Text } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import get from 'get-value';
import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../../server/utils/constants';
import { RequestStatus, DeviceFeatureCategoriesIcon } from '../../../../../utils/consts';
import MqttDeviceForm from './DeviceForm';
import { Link } from 'preact-router/match';

class MqttDeviceBox extends Component {
  saveDevice = async () => {
    this.setState({ loading: true });
    try {
      await this.props.saveDevice(this.props.device);
    } catch (e) {
      this.setState({ error: RequestStatus.Error });
    }
    this.setState({ loading: false });
  };

  deleteDevice = async () => {
    this.setState({ loading: true });
    try {
      await this.props.deleteDevice(this.props.device, this.props.deviceIndex);
    } catch (e) {
      this.setState({ error: RequestStatus.Error });
    }
    this.setState({ loading: false });
  };

  render(props, { loading }) {
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
              <div class="card-body">
                <MqttDeviceForm {...props} />

                <div class="form-group">
                  <button onClick={this.saveDevice} class="btn btn-success mr-2">
                    <Text id="integration.mqtt.device.saveButton" />
                  </button>
                  <button onClick={this.deleteDevice} class="btn btn-danger mr-2">
                    <Text id="integration.mqtt.device.deleteButton" />
                  </button>

                  <Link href={`/dashboard/integration/device/mqtt/device/${props.device.id}`}>
                    <button class="btn btn-outline-success float-right">
                      <Text id="integration.mqtt.feature.addButton" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default MqttDeviceBox;
