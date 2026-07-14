import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import DeviceFeatures from '../../../../../components/device/view/DeviceFeatures';
import { RequestStatus } from '../../../../../utils/consts';

class DiscoveredBox extends Component {
  createDevice = async () => {
    this.setState({ loading: true, createError: null });
    try {
      await this.props.createDevice(this.props.deviceIndex);
    } catch (e) {
      console.error(e);
      this.setState({ createError: RequestStatus.Error });
    }
    this.setState({ loading: false });
  };

  render({ device }, { loading, createError }) {
    return (
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            {device.name}
            {device.created && (
              <div class="page-options d-flex">
                <span class="badge badge-success">
                  <Text id="integration.externalIntegration.discover.alreadyCreatedBadge" />
                </span>
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
                {createError && (
                  <div class="alert alert-danger">
                    <Text id="integration.externalIntegration.discover.createError" />
                  </div>
                )}
                <div class="form-group">
                  <label class="form-label">
                    <Text id="integration.externalIntegration.discover.featuresLabel" />
                  </label>
                  <DeviceFeatures features={device.features} />
                </div>
                <button onClick={this.createDevice} class="btn btn-success" disabled={device.created}>
                  <Text id="integration.externalIntegration.discover.createButton" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default DiscoveredBox;
