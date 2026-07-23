import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import DeviceFeatures from '../../../../../components/device/view/DeviceFeatures';
import DeviceParams from '../components/DeviceParams';
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
                <DeviceParams device={device} />
                {device.created && device.structure_changed ? (
                  <Localizer>
                    <button
                      onClick={this.createDevice}
                      class="btn btn-warning"
                      disabled={loading}
                      title={<Text id="integration.externalIntegration.discover.updateTitle" />}
                    >
                      <i class="fe fe-refresh-cw mr-1" />
                      <Text id="integration.externalIntegration.discover.updateButton" />
                    </button>
                  </Localizer>
                ) : (
                  <button onClick={this.createDevice} class="btn btn-success" disabled={device.created || loading}>
                    <Text id="integration.externalIntegration.discover.createButton" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default DiscoveredBox;
