import { Text } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import get from 'get-value';

import { RequestStatus, DeviceFeatureCategoriesIcon } from '../../../../../utils/consts';

const GITHUB_BASE_URL = 'https://github.com/GladysAssistant/Gladys/issues/new';

const createGithubUrl = node => {
  const { rawZwaveNode } = node;
  const deviceToSend = {
    manufacturer: rawZwaveNode.manufacturer,
    manufacturerid: rawZwaveNode.manufacturerid,
    product: rawZwaveNode.product,
    producttype: rawZwaveNode.producttype,
    productid: rawZwaveNode.productid,
    classes: Object.keys(rawZwaveNode.classes)
  };
  const title = encodeURIComponent(`Z-Wave: Handle device "${rawZwaveNode.manufacturer} ${rawZwaveNode.product}"`);
  const body = encodeURIComponent('```\n' + JSON.stringify(deviceToSend, null, 2) + '\n```');
  return `${GITHUB_BASE_URL}?title=${title}&body=${body}`;
};

const displayRawNode = node => () => {
  console.log(node);
};

class ZwaveNode extends Component {
  createDevice = async () => {
    this.setState({ loading: true, error: undefined });
    try {
      await this.props.createDevice(this.props.node);
      this.setState({ deviceCreated: true });
    } catch (e) {
      const status = get(e, 'response.status');
      if (status === 409) {
        this.setState({ error: RequestStatus.ConflictError });
      } else {
        this.setState({ error: RequestStatus.Error });
      }
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
            {props.node.ready ? (
              <h3 class="card-title">{props.node.name}</h3>
            ) : (
              <h3 class="card-title">
                <Text id="integration.zwave.setup.unknowNode" />
              </h3>
            )}
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
              {error === RequestStatus.Error && (
                <div class="alert alert-danger">
                  <Text id="integration.zwave.setup.createDeviceError" />
                </div>
              )}
              {error === RequestStatus.ConflictError && (
                <div class="alert alert-danger">
                  <Text id="integration.zwave.setup.conflictError" />
                </div>
              )}
              {deviceCreated && (
                <div class="alert alert-success">
                  <Text id="integration.zwave.setup.deviceCreatedSuccess" />
                </div>
              )}
              {props.node.ready ? (
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
                                class={`fe fe-${get(
                                  DeviceFeatureCategoriesIcon,
                                  `${feature.category}.${feature.type}`
                                )}`}
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
                  <div>
                    <a
                      href={createGithubUrl(props.node)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={displayRawNode(props.node)}
                    >
                      <Text id="integration.zwave.setup.createGithubIssue" />
                    </a>
                  </div>
                </div>
              ) : (
                <div class="card-body">
                  <div class="alert alert-warning" role="alert">
                    <Text id="integration.zwave.setup.sleepingNodeMsg" />
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

export default ZwaveNode;
