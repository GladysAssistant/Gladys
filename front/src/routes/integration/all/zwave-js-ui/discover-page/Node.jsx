import { Text } from 'preact-i18n';
import { Component } from 'preact';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import get from 'get-value';

import { RequestStatus } from '../../../../../utils/consts';
import DeviceFeatures from '../../../../../components/device/view/DeviceFeatures';
import { PARAMS } from '../../../../../../../server/services/zwave-js-ui/lib/constants';

const GITHUB_BASE_URL = 'https://github.com/GladysAssistant/Gladys/issues/new';

const createGithubUrl = node => {
  const { params } = node;
  const deviceToSend = {
    product: params.find(param => param.name === PARAMS.NODE_PRODUCT).value,
    classes: params.find(param => param.name === PARAMS.NODE_CLASSES).value
  };
  const title = encodeURIComponent(`Z-Wave: Handle device "${params.product}"`);
  const body = encodeURIComponent(`\`\`\`\n${JSON.stringify(deviceToSend, null, 2)}\n\`\`\``);
  return `${GITHUB_BASE_URL}?title=${title}&body=${body}`;
};

const displayRawNode = node => () => {
  // eslint-disable-next-line no-console
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
              <h2 class="card-title">{props.node.name}</h2>
            ) : (
              <h2 class="card-title">
                <Text id="integration.zwavejsui.discover.unknowNode" />
              </h2>
            )}
            <div class="card-options">
              <span class="tag">
                <Text id="integration.zwavejsui.discover.nodeId" /> {props.node.params.find(param => param.name === PARAMS.NODE_ID).value}
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
                  <Text id="integration.zwavejsui.discover.createDeviceError" />
                </div>
              )}
              {error === RequestStatus.ConflictError && (
                <div class="alert alert-danger">
                  <Text id="integration.zwavejsui.discover.conflictError" />
                </div>
              )}
              {deviceCreated && (
                <div class="alert alert-success">
                  <Text id="integration.zwavejsui.discover.deviceCreatedSuccess" />
                </div>
              )}
              {props.node.ready ? (
                <div class="card-body">
                  <div class="form-group">
                    <label>
                      <Text id="integration.zwavejsui.discover.name" />
                    </label>
                    <input type="text" class="form-control" value={props.node.name} onChange={this.editNodeName} />
                  </div>
                  {props.node.features.length > 0 && (
                    <div class="form-group">
                      <label>
                        <Text id="integration.zwavejsui.discover.features" />
                      </label>
                      <DeviceFeatures features={props.node.features} />
                    </div>
                  )}
                  <div class="form-group">
                    <button class="btn btn-success" onClick={this.createDevice}>
                      <Text id="integration.zwavejsui.discover.createDeviceInGladys" />
                    </button>
                  </div>
                  <div>
                    <Link
                      href={createGithubUrl(props.node)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={displayRawNode(props.node)}
                    >
                      <span class="icon mr-3">
                        <i class="fe fe-external-link" />
                      </span>
                      <Text id="integration.zwavejsui.discover.createGithubIssue" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div class="card-body">
                  <div class="alert alert-warning" role="alert">
                    <Text id="integration.zwavejsui.discover.sleepingNodeMsg" />
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
