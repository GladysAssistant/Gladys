import { Text } from 'preact-i18n';
import { Component } from 'preact';
import { RequestStatus } from '../../../../utils/consts';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import MatterPage from './MatterPage';

const DeviceDisplay = ({
  device,
  nodeId,
  collapsedDevices,
  visibleKeys,
  toggleDevice,
  toggleKeys,
  parentPath = ''
}) => {
  const devicePath = parentPath ? `${parentPath}-${device.number}` : `${nodeId}-${device.number}`;
  const isCollapsed = collapsedDevices[devicePath];
  const level = parentPath.split('-').length - 1;

  return (
    <div class={cx('mb-4', { 'ms-4': level > 0 })}>
      <div class="d-flex align-items-center cursor-pointer mb-3" onClick={() => toggleDevice(devicePath)}>
        <i
          class={cx('fe me-2', {
            'fe-chevron-right': isCollapsed,
            'fe-chevron-down': !isCollapsed
          })}
        />
        <h6 class="mb-0">
          {level > 0 && <span class="text-muted me-2">Child Endpoint:</span>}
          Device: {device.name} (Endpoint: {device.number})
        </h6>
      </div>

      {!isCollapsed && (
        <>
          <div class="table-responsive">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Cluster ID</th>
                  <th>Cluster Name</th>
                  <th>Attributes</th>
                  <th>Commands</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {device.cluster_clients.map(cluster => {
                  const clusterKey = `${devicePath}-${cluster.id}`;
                  const areKeysVisible = visibleKeys[clusterKey];

                  return (
                    <>
                      <tr>
                        <td>{cluster.id}</td>
                        <td>{cluster.name}</td>
                        <td>
                          <ul class="list-unstyled mb-0">
                            {cluster.attributes.map(attr => (
                              <li>
                                <small>{attr}</small>
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td>
                          <ul class="list-unstyled mb-0">
                            {cluster.commands.map(cmd => (
                              <li>
                                <small>{cmd}</small>
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td>
                          <button class="btn btn-outline-secondary btn-sm" onClick={() => toggleKeys(clusterKey)}>
                            {areKeysVisible ? 'Hide Keys' : 'Show Keys'}
                          </button>
                        </td>
                      </tr>
                      {areKeysVisible && (
                        <tr>
                          <td colspan="5" class="bg-light">
                            <div class="p-2">
                              <small class="text-muted">All Keys:</small>
                              <div class="row mt-2">
                                {cluster.all_keys.map(key => (
                                  <div class="col-lg-3 col-md-4 col-sm-6">
                                    <small>{key}</small>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {device.child_endpoints && device.child_endpoints.length > 0 && (
            <div class="mt-4">
              {device.child_endpoints.map(childDevice => (
                <DeviceDisplay
                  device={childDevice}
                  nodeId={nodeId}
                  collapsedDevices={collapsedDevices}
                  visibleKeys={visibleKeys}
                  toggleDevice={toggleDevice}
                  toggleKeys={toggleKeys}
                  parentPath={devicePath}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

class MatterSettingsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      matterEnabled: null,
      loading: true,
      saving: false,
      error: null,
      nodes: [],
      loadingNodes: true,
      decommissioningNodes: {},
      collapsedDevices: {},
      visibleKeys: {}
    };
  }

  componentDidMount() {
    this.init();
  }

  init = async () => {
    await this.setState({ loading: true });
    await this.loadConfiguration();
    if (this.state.matterEnabled) {
      await this.loadNodes();
    }
    await this.setState({ loading: false });
  };

  loadConfiguration = async () => {
    try {
      const { value: matterEnabled } = await this.props.httpClient.get(
        '/api/v1/service/matter/variable/MATTER_ENABLED'
      );
      await this.setState({
        matterEnabled: matterEnabled === 'true'
      });
    } catch (e) {
      console.error(e);
      await this.setState({
        matterEnabled: false
      });
    }
    try {
      const { has_ipv6: hasIpv6, ipv6_interfaces: ipv6Interfaces } = await this.props.httpClient.get(
        '/api/v1/service/matter/ipv6'
      );
      await this.setState({
        hasIpv6,
        ipv6Interfaces
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

      // Initialize all devices as collapsed
      const collapsedDevices = {};
      nodes.forEach(node => {
        node.devices.forEach(device => {
          const deviceKey = `${node.node_id}-${device.number}`;
          collapsedDevices[deviceKey] = true;
        });
      });

      this.setState({
        nodes,
        loadingNodes: false,
        collapsedDevices
      });
    } catch (e) {
      console.error(e);
      this.setState({ loadingNodes: false });
    }
  };

  disableMatter = async () => {
    this.setState({ saving: true });
    try {
      await this.props.httpClient.post('/api/v1/service/matter/variable/MATTER_ENABLED', {
        value: 'false'
      });
      // stop service
      await this.props.httpClient.post('/api/v1/service/matter/stop');
      this.setState({
        saving: false,
        error: null,
        nodes: [],
        matterEnabled: false
      });
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

  enableMatter = async () => {
    this.setState({ saving: true });
    try {
      await this.props.httpClient.post('/api/v1/service/matter/variable/MATTER_ENABLED', {
        value: 'true'
      });
      // start service
      await this.props.httpClient.post('/api/v1/service/matter/start');
      // Load the nodes
      await this.loadNodes();

      this.setState({
        saving: false,
        error: null,
        matterEnabled: true
      });
    } catch (e) {
      console.error(e);
      this.setState({ saving: false, error: RequestStatus.Error });
    }
  };

  toggleDevice = devicePath => {
    this.setState(prevState => ({
      collapsedDevices: {
        ...prevState.collapsedDevices,
        [devicePath]: !prevState.collapsedDevices[devicePath]
      }
    }));
  };

  toggleKeys = clusterKey => {
    this.setState(prevState => ({
      visibleKeys: {
        ...prevState.visibleKeys,
        [clusterKey]: !prevState.visibleKeys[clusterKey]
      }
    }));
  };

  downloadNodesJson = () => {
    const { nodes } = this.state;
    const dataStr = JSON.stringify(nodes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(dataBlob);

    // Create filename with local datetime
    const now = new Date();
    const datetime = now
      .toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
      .replace(/[/,:]/g, '-')
      .replace(/\s/g, '_');

    const filename = `matter-nodes-gladys-assistant-${datetime}.json`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  render() {
    const {
      matterEnabled,
      saving,
      error,
      nodes,
      loading,
      loadingNodes,
      decommissioningNodes,
      collapsedDevices,
      visibleKeys,
      hasIpv6
    } = this.state;

    return (
      <MatterPage user={this.props.user}>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <Text id="integration.matter.settings.title" />
            </h3>
          </div>
          <div
            class={cx('card-body dimmer', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              {hasIpv6 === false && (
                <div class="alert alert-danger">
                  <Text id="integration.matter.settings.ipv6NotEnabled" />
                </div>
              )}

              {hasIpv6 === true && (
                <div class="alert alert-success">
                  <Text id="integration.matter.settings.ipv6Enabled" />
                </div>
              )}

              {!matterEnabled && (
                <>
                  <div class="alert alert-warning">
                    <Text id="integration.matter.settings.disabledWarningSettings" />
                  </div>
                  <div class="form-group">
                    <button onClick={this.enableMatter} class="btn btn-success" disabled={saving}>
                      <Text id="integration.matter.settings.enableButton" />
                    </button>
                  </div>
                </>
              )}

              {matterEnabled && (
                <>
                  <div class="alert alert-info">
                    <Text id="integration.matter.settings.description" />
                  </div>

                  {error === RequestStatus.Error && (
                    <div class="alert alert-danger">
                      <Text id="integration.matter.settings.error" />
                    </div>
                  )}

                  <div class="mt-5">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                      <h4 class="mb-0">
                        <Text id="integration.matter.settings.nodesTitle" />
                      </h4>
                      {nodes && nodes.length > 0 && (
                        <button onClick={this.downloadNodesJson} class="btn btn-secondary btn-sm">
                          <i class="fe fe-download me-2" /> <Text id="integration.matter.settings.downloadNodesJson" />
                        </button>
                      )}
                    </div>

                    <div
                      class={cx('dimmer', {
                        active: loadingNodes
                      })}
                    >
                      <div class="loader" />
                      <div class="dimmer-content">
                        {nodes && nodes.length > 0 ? (
                          <div class="table-responsive">
                            {nodes.map(node => (
                              <div class={cx('card mb-4', { 'dimmer active': decommissioningNodes[node.node_id] })}>
                                {decommissioningNodes[node.node_id] && <div class="loader" />}
                                <div class="dimmer-content">
                                  <div class="card-header">
                                    <div class="d-flex justify-content-between align-items-center w-100">
                                      <div>
                                        <h5 class="mb-0">
                                          {node.node_information.vendor_name} - {node.node_information.product_name}
                                        </h5>
                                        <small class="text-muted">
                                          Node ID: {node.node_id} | Vendor ID: {node.node_information.vendor_id} |
                                          Product ID: {node.node_information.product_id}
                                        </small>
                                      </div>
                                      <div class="ms-auto">
                                        <button
                                          onClick={() => this.decommissionNode(node.node_id)}
                                          class={cx('btn btn-danger btn-sm', {
                                            loading: decommissioningNodes[node.node_id]
                                          })}
                                          disabled={decommissioningNodes[node.node_id]}
                                        >
                                          <Text id="integration.matter.settings.decommissionButton" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                  <div class="card-body">
                                    {node.devices.map(device => (
                                      <DeviceDisplay
                                        device={device}
                                        nodeId={node.node_id}
                                        collapsedDevices={collapsedDevices}
                                        visibleKeys={visibleKeys}
                                        toggleDevice={this.toggleDevice}
                                        toggleKeys={this.toggleKeys}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div class="alert alert-secondary">
                            <Text id="integration.matter.settings.noNodesFound" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div class="form-group">
                    <button onClick={this.disableMatter} class="btn btn-danger" disabled={saving}>
                      <Text id="integration.matter.settings.disableButton" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </MatterPage>
    );
  }
}

export default connect('httpClient,user', {})(MatterSettingsPage);
