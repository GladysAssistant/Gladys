import { Text, MarkupText } from 'preact-i18n';
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

// Gladys errors are JSON objects carrying `error` or `code`. An HTML error page from a proxy (ex: 504),
// or a Gladys Plus transport error (`error_code`: the instance did not answer) also come with a
// `response`, but they do not mean that Gladys refused the request.
const isAnswerFromGladys = e => {
  const data = e.response && e.response.data;
  return Boolean(data && typeof data === 'object' && !data.error_code && (data.error || data.code));
};

const DecommissionFeedback = ({ feedback, onDismiss }) => {
  const dismissButton = <button type="button" class="close" onClick={onDismiss} />;
  if (feedback.status === 'error') {
    return (
      <div class="alert alert-danger alert-dismissible">
        {dismissButton}
        <Text id="integration.matter.settings.decommission.error" fields={{ name: feedback.name }} />
        {feedback.message && (
          <div>
            <small>{feedback.message}</small>
          </div>
        )}
      </div>
    );
  }
  if (feedback.status === 'noResponse') {
    return (
      <div class="alert alert-warning alert-dismissible">
        {dismissButton}
        <Text id="integration.matter.settings.decommission.noResponse" fields={{ name: feedback.name }} />
      </div>
    );
  }
  return (
    <>
      <div class="alert alert-success alert-dismissible">
        {dismissButton}
        <Text id="integration.matter.settings.decommission.success" fields={{ name: feedback.name }} />
        {feedback.deletedDevices.length > 0 && (
          <span>
            {' '}
            <Text
              id="integration.matter.settings.decommission.devicesDeleted"
              plural={feedback.deletedDevices.length}
              fields={{ count: feedback.deletedDevices.length }}
            />
          </span>
        )}
      </div>
      {feedback.forced && (
        <div class="alert alert-warning">
          <Text id="integration.matter.settings.decommission.forcedWarning" fields={{ name: feedback.name }} />
        </div>
      )}
      {feedback.failedDevices.length > 0 && (
        <div class="alert alert-warning">
          <Text id="integration.matter.settings.decommission.devicesNotDeleted" fields={{ name: feedback.name }} />
          <ul class="mb-0">
            {feedback.failedDevices.map(device => (
              <li key={device.selector}>{device.name}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

class MatterSettingsPage extends Component {
  constructor(props) {
    super(props);
    this.decommissionsInProgress = new Set();
    this.state = {
      matterEnabled: null,
      loading: true,
      saving: false,
      error: null,
      nodes: [],
      loadingNodes: true,
      decommissioningNodes: {},
      nodeToDecommission: null,
      deleteGladysDevices: false,
      // outcome of each decommission, by node id: several nodes can be decommissioned at the same time
      decommissionFeedbacks: {},
      collapsedDevices: {},
      visibleKeys: {},
      showConfirmReset: false,
      resetting: false,
      resetError: null
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

  // GET requests already in flight are shared by the HTTP clients: a reload asked while one runs
  // could get an answer prepared before the change that asked for it (ex: a decommission which just
  // ended). The reloads are therefore chained, and one more runs if one was asked in the meantime.
  loadNodes = () => {
    if (this.loadingNodesPromise) {
      this.nodesReloadRequested = true;
      return this.loadingNodesPromise;
    }
    this.loadingNodesPromise = (async () => {
      try {
        do {
          this.nodesReloadRequested = false;
          await this.fetchNodes();
        } while (this.nodesReloadRequested);
      } finally {
        this.loadingNodesPromise = null;
      }
    })();
    return this.loadingNodesPromise;
  };

  fetchNodes = async () => {
    this.setState({ loadingNodes: true });
    try {
      const nodes = await this.props.httpClient.get('/api/v1/service/matter/node', { with_gladys_devices: true });

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

  askDecommissionNode = nodeId => {
    this.setState({ nodeToDecommission: nodeId, deleteGladysDevices: false });
  };

  cancelDecommissionNode = () => {
    this.setState({ nodeToDecommission: null });
  };

  toggleDeleteGladysDevices = () => {
    this.setState(prevState => ({ deleteGladysDevices: !prevState.deleteGladysDevices }));
  };

  setDecommissionFeedback = (nodeId, feedback) => {
    this.setState(prevState => {
      const decommissionFeedbacks = { ...prevState.decommissionFeedbacks };
      if (feedback) {
        decommissionFeedbacks[nodeId] = feedback;
      } else {
        delete decommissionFeedbacks[nodeId];
      }
      return { decommissionFeedbacks };
    });
  };

  decommissionNode = async node => {
    const nodeId = node.node_id;
    // synchronous guard: setState is asynchronous, a double click would otherwise send two requests
    if (this.decommissionsInProgress.has(nodeId)) {
      return;
    }
    this.decommissionsInProgress.add(nodeId);
    const name = `${node.node_information.vendor_name} - ${node.node_information.product_name}`;
    // only the devices the user saw in the confirmation are sent: the server deletes nothing else
    const gladysDeviceSelectors = this.state.deleteGladysDevices
      ? node.gladys_devices.map(gladysDevice => gladysDevice.selector)
      : [];
    this.setDecommissionFeedback(nodeId, null);
    this.setState(prevState => ({
      nodeToDecommission: null,
      decommissioningNodes: {
        ...prevState.decommissioningNodes,
        [nodeId]: true
      }
    }));
    try {
      const result = await this.props.httpClient.post(`/api/v1/service/matter/node/${nodeId}/decommission`, {
        gladys_device_selectors: gladysDeviceSelectors
      });
      this.setDecommissionFeedback(nodeId, {
        status: 'success',
        name,
        forced: result.forced,
        deletedDevices: result.deleted_devices,
        failedDevices: result.failed_devices
      });
    } catch (e) {
      console.error(e);
      if (isAnswerFromGladys(e)) {
        // Gladys answered with an error: the node has not been removed
        const { data } = e.response;
        this.setDecommissionFeedback(nodeId, { status: 'error', name, message: data.error || data.message });
      } else {
        // timeout, connection lost, proxy or Gladys Plus error: Gladys may still have removed the node
        this.setDecommissionFeedback(nodeId, { status: 'noResponse', name });
      }
    }
    this.decommissionsInProgress.delete(nodeId);
    this.setState(prevState => ({
      decommissioningNodes: {
        ...prevState.decommissioningNodes,
        [nodeId]: false
      }
    }));
    // in every case, the list shows the actual state of the nodes
    await this.loadNodes();
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

  showConfirmReset = () => {
    this.setState({ showConfirmReset: true });
  };

  cancelReset = () => {
    this.setState({ showConfirmReset: false });
  };

  confirmReset = async () => {
    this.setState({ showConfirmReset: false, resetting: true, resetError: null });
    try {
      await this.props.httpClient.post('/api/v1/service/matter/reset');
      this.setState({
        resetting: false,
        matterEnabled: false,
        nodes: []
      });
    } catch (e) {
      console.error(e);
      this.setState({ resetting: false, resetError: true });
    }
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
      nodeToDecommission,
      deleteGladysDevices,
      decommissionFeedbacks,
      collapsedDevices,
      visibleKeys,
      hasIpv6,
      showConfirmReset,
      resetting,
      resetError
    } = this.state;
    const isAdmin = this.props.user && this.props.user.role === 'admin';

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
                        <button onClick={this.downloadNodesJson} class="btn btn-secondary btn-sm flex-shrink-0 ml-2">
                          <i class="fe fe-download" />
                          <span class="d-none d-sm-inline-block ml-2">
                            <Text id="integration.matter.settings.downloadNodesJson" />
                          </span>
                        </button>
                      )}
                    </div>

                    {Object.keys(decommissionFeedbacks).map(nodeId => (
                      <DecommissionFeedback
                        key={nodeId}
                        feedback={decommissionFeedbacks[nodeId]}
                        onDismiss={() => this.setDecommissionFeedback(nodeId, null)}
                      />
                    ))}

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
                                    <div class="d-flex justify-content-between align-items-start w-100">
                                      <div style="min-width: 0;">
                                        <h5 class="mb-0">
                                          {node.node_information.vendor_name} - {node.node_information.product_name}
                                        </h5>
                                        <small class="text-muted" style="overflow-wrap: break-word;">
                                          Node ID: {node.node_id} | Vendor ID: {node.node_information.vendor_id} |
                                          Product ID: {node.node_information.product_id}
                                        </small>
                                      </div>
                                      {isAdmin && (
                                        <button
                                          onClick={() => this.askDecommissionNode(node.node_id)}
                                          class={cx('btn btn-danger btn-sm flex-shrink-0 ml-2', {
                                            loading: decommissioningNodes[node.node_id]
                                          })}
                                          disabled={
                                            decommissioningNodes[node.node_id] || nodeToDecommission === node.node_id
                                          }
                                        >
                                          <Text id="integration.matter.settings.decommissionButton" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  {nodeToDecommission === node.node_id && (
                                    <div class="card-body border-bottom">
                                      <div class="alert alert-danger mb-3">
                                        <MarkupText id="integration.matter.settings.decommission.confirmMessage" />
                                      </div>
                                      {node.gladys_devices.length > 0 && (
                                        <div class="mb-3">
                                          <Text id="integration.matter.settings.decommission.linkedDevices" />
                                          <ul>
                                            {node.gladys_devices.map(gladysDevice => (
                                              <li key={gladysDevice.selector}>{gladysDevice.name}</li>
                                            ))}
                                          </ul>
                                          <label class="custom-control custom-checkbox">
                                            <input
                                              type="checkbox"
                                              class="custom-control-input"
                                              checked={deleteGladysDevices}
                                              onChange={this.toggleDeleteGladysDevices}
                                            />
                                            <span class="custom-control-label">
                                              <Text id="integration.matter.settings.decommission.deleteDevicesLabel" />
                                            </span>
                                          </label>
                                          <small class="form-text text-muted">
                                            <Text id="integration.matter.settings.decommission.deleteDevicesHelp" />
                                          </small>
                                        </div>
                                      )}
                                      <div>
                                        <button
                                          class="btn btn-danger"
                                          onClick={() => this.decommissionNode(node)}
                                          disabled={decommissioningNodes[node.node_id]}
                                        >
                                          <Text id="integration.matter.settings.decommission.confirmButton" />
                                        </button>
                                        <button
                                          class="btn ml-2"
                                          onClick={this.cancelDecommissionNode}
                                          disabled={decommissioningNodes[node.node_id]}
                                        >
                                          <Text id="integration.matter.settings.decommission.cancelButton" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
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

                  <div class="mt-5">
                    <h4>
                      <Text id="integration.matter.settings.reset.title" />
                    </h4>
                    <p class="text-muted">
                      <Text id="integration.matter.settings.reset.description" />
                    </p>

                    {resetError && (
                      <div class="alert alert-danger">
                        <Text id="integration.matter.settings.reset.error" />
                      </div>
                    )}

                    {!showConfirmReset && (
                      <button
                        class="btn btn-outline-danger"
                        onClick={this.showConfirmReset}
                        disabled={saving || resetting}
                      >
                        <Text id="integration.matter.settings.reset.button" />
                      </button>
                    )}

                    {showConfirmReset && (
                      <div class="d-flex flex-column align-items-start" style="row-gap: 1em">
                        <div class="alert alert-danger mb-0">
                          <Text id="integration.matter.settings.reset.confirmMessage" />
                        </div>
                        <div>
                          <button class="btn btn-danger" onClick={this.confirmReset} disabled={resetting}>
                            <Text id="integration.matter.settings.reset.confirmButton" />
                          </button>
                          <button class="btn ml-2" onClick={this.cancelReset} disabled={resetting}>
                            <Text id="integration.matter.settings.reset.cancelButton" />
                          </button>
                        </div>
                      </div>
                    )}
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
