import { Text } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';

import { RequestStatus } from '../../../../utils/consts';
import DeviceFeatures from '../../../../components/device/view/DeviceFeatures';

class XiaomiSensor extends Component {
  createDevice = async () => {
    this.setState({ loading: true });
    try {
      await this.props.createDevice(this.props.sensor, this.props.sensorIndex);
      this.setState({ deviceCreated: true });
    } catch (e) {
      this.setState({ error: RequestStatus.Error });
    }
    this.setState({ loading: false });
  };

  render(props, { loading, error, deviceCreated }) {
    return (
      <div class="col-md-3">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">{props.sensor.name}</h3>
          </div>
          <div
            class={cx('dimmer', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              {error && (
                <div class="alert alert-danger">
                  <Text id="integration.xiaomi.setup.createDeviceError" />
                </div>
              )}
              {deviceCreated && (
                <div class="alert alert-success">
                  <Text id="integration.xiaomi.setup.deviceCreatedSuccess" />
                </div>
              )}
              <div class="card-body">
                {props.sensor.features.length > 0 && (
                  <div class="form-group">
                    <DeviceFeatures features={props.sensor.features} />
                  </div>
                )}
                <div class="form-group">
                  <button class="btn btn-sm btn-success" onClick={this.createDevice}>
                    <Text id="integration.xiaomi.setup.createDeviceInGladys" />
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

export default XiaomiSensor;
