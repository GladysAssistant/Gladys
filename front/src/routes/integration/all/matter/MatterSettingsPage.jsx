import { Text } from 'preact-i18n';
import { Component } from 'preact';
import { RequestStatus } from '../../../../utils/consts';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import MatterPage from './MatterPage';

class MatterSettingsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      matterEnabled: false,
      saving: false,
      error: null,
      nodes: [],
      loadingNodes: true,
      decommissioningNodes: {}
    };
  }

  componentDidMount() {
    this.init();
  }

  init = async () => {
    await this.loadConfiguration();
    await this.loadNodes();
  };

  loadConfiguration = async () => {
    try {
      const config = await this.props.httpClient.get('/api/v1/service/matter/configuration');
      this.setState({
        matterEnabled: config.enabled
      });
    } catch (e) {
      console.error(e);
      this.setState({ error: RequestStatus.Error });
    }
  };

  loadNodes = async () => {
    this.setState({ loadingNodes: true });
    try {
      const nodes = await this.props.httpClient.get('/api/v1/service/matter/node');
      this.setState({ nodes, loadingNodes: false });
    } catch (e) {
      console.error(e);
      this.setState({ loadingNodes: false });
    }
  };

  saveConfiguration = async () => {
    this.setState({ saving: true });
    try {
      await this.props.httpClient.post('/api/v1/service/matter/configuration', {
        enabled: this.state.matterEnabled
      });
      this.setState({ saving: false, error: null });
    } catch (e) {
      console.error(e);
      this.setState({ saving: false, error: RequestStatus.Error });
    }
  };

  decommissionNode = async nodeId => {
    this.setState({
      decommissioningNodes: {
        ...this.state.decommissioningNodes,
        [nodeId]: true
      }
    });
    try {
      await this.props.httpClient.post(`/api/v1/service/matter/node/${nodeId}/decommission`);
      await this.loadNodes();
    } catch (e) {
      console.error(e);
    }
    this.setState({
      decommissioningNodes: {
        ...this.state.decommissioningNodes,
        [nodeId]: false
      }
    });
  };

  render() {
    const { matterEnabled, saving, error, nodes, loadingNodes, decommissioningNodes } = this.state;

    return (
      <MatterPage user={this.props.user}>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <Text id="integration.matter.settings.title" />
            </h3>
          </div>
          <div class="card-body">
            <div class="alert alert-info">
              <Text id="integration.matter.settings.description" />
            </div>

            <div class="form-group">
              <label class="custom-switch">
                <input
                  type="checkbox"
                  class="custom-switch-input"
                  checked={matterEnabled}
                  onChange={e => this.setState({ matterEnabled: e.target.checked })}
                  disabled={saving}
                />
                <span class="custom-switch-indicator" />
                <span class="custom-switch-description">
                  <Text id="integration.matter.settings.enableIntegration" />
                </span>
              </label>
            </div>

            <div class="form-group">
              <button onClick={this.saveConfiguration} class="btn btn-success" disabled={saving}>
                <Text id="integration.matter.settings.saveButton" />
              </button>
            </div>

            {error === RequestStatus.Error && (
              <div class="alert alert-danger">
                <Text id="integration.matter.settings.error" />
              </div>
            )}

            <div class="mt-5">
              <h4>
                <Text id="integration.matter.settings.nodesTitle" />
              </h4>
              <div
                class={cx('dimmer', {
                  active: loadingNodes
                })}
              >
                <div class="loader" />
                <div class="dimmer-content">
                  {nodes && nodes.length > 0 ? (
                    <div class="table-responsive">
                      <table class="table table-hover table-outline">
                        <thead>
                          <tr>
                            <th>
                              <Text id="integration.matter.settings.nodeIdLabel" />
                            </th>
                            <th>
                              <Text id="integration.matter.settings.nodeDetailsLabel" />
                            </th>
                            <th class="text-right">
                              <Text id="integration.matter.settings.actionsLabel" />
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {nodes.map(node => (
                            <tr>
                              <td>{node.node_id}</td>
                              <td>
                                {node.node_information.vendor_name} - {node.node_information.product_label}
                              </td>
                              <td class="text-right">
                                <button
                                  onClick={() => this.decommissionNode(node.node_id)}
                                  class={cx('btn btn-danger', {
                                    loading: decommissioningNodes[node.node_id]
                                  })}
                                  disabled={decommissioningNodes[node.node_id]}
                                >
                                  <Text id="integration.matter.settings.decommissionButton" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div class="alert alert-secondary">
                      <Text id="integration.matter.settings.noNodesFound" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </MatterPage>
    );
  }
}

export default connect('httpClient,user', {})(MatterSettingsPage);
