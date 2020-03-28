import { Text } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import get from 'get-value';

import { RequestStatus, DeviceFeatureCategoriesIcon } from '../../../../../utils/consts';

class ZwaveNode extends Component {
  createDevice = async () => {
    this.setState({ loading: true });
    try {
      await this.props.createDevice(this.props.node);
      this.setState({ deviceCreated: true });
    } catch (e) {
      this.setState({ error: RequestStatus.Error });
    }
    this.setState({ loading: false });
  };

  editNodeName = e => {
    this.props.editNodeName(this.props.nodeIndex, e.target.value);
  };

  render(props, { loading, error, deviceCreated }) {
    return (
      <div index={props.node.id} class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">{props.node.name}</h3>
            <div class="card-options">
              <span class="tag">
                <Text id="integration.zwave.setup.nodeId" /> {props.node.rawZwaveNode.id}
              </span>
            </div>
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
                  <Text id="integration.zwave.setup.createDeviceError" />
                </div>
              )}
              {deviceCreated && (
                <div class="alert alert-success">
                  <Text id="integration.zwave.setup.deviceCreatedSuccess" />
                </div>
              )}
              <div class="card-body">
                <div class="form-group">
                  <label>
                    <Text id="integration.zwave.setup.name" />
                  </label>
                  <input type="text" class="form-control" value={props.node.name} onChange={this.editNodeName} />
                </div>
                <div class="form-group">
                  <label>
                    <Text id="integration.zwave.setup.type" />
                  </label>
                  <input type="text" class="form-control" disabled value={props.node.rawZwaveNode.type} />
                </div>
                {props.node.features.length > 0 && (
                  <div class="form-group">
                    <label>
                      <Text id="integration.zwave.setup.features" />
                    </label>

                    <div class="tags">
                      {props.node.features.map(feature => (
                        <span class="tag">
                          <Text id={`deviceFeatureCategory.${feature.category}.${feature.type}`} />
                          <div class="tag-addon">
                            <i
                              class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${feature.category}.${feature.type}`)}`}
                            />
                          </div>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div class="form-group">
                  <button class="btn btn-success" onClick={this.createDevice}>
                    <Text id="integration.zwave.setup.createDeviceInGladys" />
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

export default ZwaveNode;
