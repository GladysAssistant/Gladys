import { Text } from 'preact-i18n';
import { Component } from 'preact';
import { route } from 'preact-router';
import { Link } from 'preact-router/match';
import Feature from './Feature';
import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../../../server/utils/constants';
import { RequestStatus } from '../../../../../../utils/consts';
import MqttDeviceForm from '../DeviceForm';
import cx from 'classnames';

class FeatureTab extends Component {
  saveDevice = async () => {
    this.setState({ loading: true });
    try {
      await this.props.saveDevice(this.props.device);
      route(`/dashboard/integration/device/mqtt/device`);
    } catch (e) {
      this.setState({
        loading: false,
        error: RequestStatus.Error
      });
    }
  };

  deleteDevice = async () => {
    this.setState({ loading: true });
    try {
      await this.props.deleteDevice(this.props.device, this.props.deviceIndex);
      route(`/dashboard/integration/device/mqtt/device`);
    } catch (e) {
      this.setState({
        loading: false,
        error: RequestStatus.Error
      });
    }
  };

  selectFeature(e) {
    this.setState({
      selectedFeature: e.target.value
    });
  }

  addFeature() {
    this.props.addDeviceFeature(this.props.deviceIndex, this.state.selectedFeature);

    this.setState({
      selectedFeature: undefined
    });
  }

  constructor(props) {
    super(props);

    this.saveDevice = this.saveDevice.bind(this);
    this.deleteDevice = this.deleteDevice.bind(this);
    this.selectFeature = this.selectFeature.bind(this);
    this.addFeature = this.addFeature.bind(this);
  }

  render({ children, ...props }, { error, loading, selectedFeature }) {
    return (
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            {(props.device && props.device.name) || <Text id="integration.mqtt.device.noNameLabel" />}
          </h3>
        </div>
        <div
          class={cx('dimmer', {
            active: loading
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            <div class="card-body">
              {error && (
                <div class="alert alert-danger">
                  <Text id="integration.mqtt.device.saveError" />
                </div>
              )}
              {!props.device && (
                <div>
                  <p class="alert alert-danger">
                    <Text id="integration.mqtt.device.notFound" />
                  </p>
                  <Link href="/dashboard/integration/device/mqtt/device">
                    <button type="button" class="btn btn-outline-secondary btn-sm">
                      <Text id="integration.mqtt.device.backToList" />
                    </button>
                  </Link>
                </div>
              )}
              {props.device && (
                <div>
                  <MqttDeviceForm {...props} />

                  <div class="form-group form-inline">
                    <select class="form-control" onChange={this.selectFeature}>
                      <option value="">
                        <Text id="global.emptySelectOption" />
                      </option>
                      {Object.values(DEVICE_FEATURE_CATEGORIES).map(category => (
                        <option value={category} selected={category === selectedFeature}>
                          <Text id={`deviceFeatureCategory.${category}`} />
                        </option>
                      ))}
                    </select>
                    <button onClick={this.addFeature} class="btn btn-outline-success ml-2" disabled={!selectedFeature}>
                      <Text id="integration.mqtt.feature.addButton" />
                    </button>
                  </div>

                  <div class="row">
                    {props.device &&
                      props.device.features.map((feature, index) => (
                        <Feature {...props} feature={feature} featureIndex={index} />
                      ))}
                  </div>

                  <div class="form-group">
                    <button onClick={this.saveDevice} class="btn btn-success mr-2">
                      <Text id="integration.mqtt.device.saveButton" />
                    </button>
                    <button onClick={this.deleteDevice} class="btn btn-danger mr-2">
                      <Text id="integration.mqtt.device.deleteButton" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default FeatureTab;
