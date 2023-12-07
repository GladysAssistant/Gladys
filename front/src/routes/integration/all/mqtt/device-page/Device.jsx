import { Text, MarkupText } from 'preact-i18n';
import { Component } from 'preact';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import get from 'get-value';

import { RequestStatus } from '../../../../../utils/consts';
import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../../server/utils/constants';
import MqttDeviceForm from './DeviceForm';
import BatteryLevelFeature from '../../../../../components/device/view/BatteryLevelFeature';

class MqttDeviceBox extends Component {
  saveDevice = async () => {
    this.setState({ loading: true });
    try {
      await this.props.saveDevice(this.props.device, this.props.deviceIndex);
    } catch (e) {
      this.setState({ error: RequestStatus.Error });
    }
    this.setState({ loading: false });
  };

  deleteDevice = async () => {
    this.setState({ loading: true, tooMuchStatesError: false, statesNumber: undefined });
    try {
      await this.props.deleteDevice(this.props.device, this.props.deviceIndex);
    } catch (e) {
      const status = get(e, 'response.status');
      const dataMessage = get(e, 'response.data.message');
      if (status === 400 && dataMessage && dataMessage.includes('Too much states')) {
        const statesNumber = new Intl.NumberFormat().format(dataMessage.split(' ')[0]);
        this.setState({ tooMuchStatesError: true, statesNumber });
      } else {
        this.setState({ error: RequestStatus.Error });
      }
    }
    this.setState({ loading: false });
  };

  getDeviceProperty = () => {
    if (!this.props.device.features) {
      return null;
    }
    const batteryLevelDeviceFeature = this.props.device.features.find(
      deviceFeature => deviceFeature.category === DEVICE_FEATURE_CATEGORIES.BATTERY
    );
    const batteryLevel = get(batteryLevelDeviceFeature, 'last_value');
    let mostRecentValueAt = null;
    this.props.device.features.forEach(feature => {
      if (feature.last_value_changed && new Date(feature.last_value_changed) > mostRecentValueAt) {
        mostRecentValueAt = new Date(feature.last_value_changed);
      }
    });
    return {
      batteryLevel,
      mostRecentValueAt
    };
  };

  render(props, { loading, tooMuchStatesError, statesNumber }) {
    const { batteryLevel, mostRecentValueAt } = this.getDeviceProperty();
    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            {props.device.name || <Text id="integration.mqtt.device.noNameLabel" />}{' '}
            {batteryLevel && (
              <div class="page-options d-flex">
                <BatteryLevelFeature batteryLevel={batteryLevel} />
              </div>
            )}
          </div>
          <div
            class={cx('dimmer', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              <div class="card-body">
                {tooMuchStatesError && (
                  <div class="alert alert-warning">
                    <MarkupText id="device.tooMuchStatesToDelete" fields={{ count: statesNumber }} />
                  </div>
                )}

                <MqttDeviceForm {...props} mostRecentValueAt={mostRecentValueAt} />

                <div class="form-group">
                  <button onClick={this.saveDevice} class="btn btn-success mr-2">
                    <Text id="integration.mqtt.device.saveButton" />
                  </button>
                  <button onClick={this.deleteDevice} class="btn btn-danger mr-2">
                    <Text id="integration.mqtt.device.deleteButton" />
                  </button>

                  <Link href={`/dashboard/integration/device/mqtt/edit/${props.device.selector}`}>
                    <button class="btn btn-secondary float-right">
                      <Text id="integration.mqtt.device.editButton" />
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
