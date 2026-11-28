import { Text } from 'preact-i18n';
import cx from 'classnames';

// The endpoints and clusters of a node, for the expert mode of the settings page
// (server/services/matter/docs/specs/matter.md)
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
    <div class={cx('mb-4', { 'ml-4': level > 0 })}>
      <button
        type="button"
        class="btn btn-link text-reset text-decoration-none p-0 d-flex align-items-center mb-3"
        aria-expanded={!isCollapsed}
        onClick={() => toggleDevice(devicePath)}
        data-cy="matter-expert-endpoint-toggle"
      >
        <i
          class={cx('fe mr-2', {
            'fe-chevron-right': isCollapsed,
            'fe-chevron-down': !isCollapsed
          })}
        />
        <h6 class="mb-0">
          {level > 0 && (
            <span class="text-muted mr-2">
              <Text id="integration.matter.settings.node.childEndpoint" />
            </span>
          )}
          <Text id="integration.matter.settings.node.device" fields={{ name: device.name, number: device.number }} />
        </h6>
      </button>

      {!isCollapsed && (
        <>
          <div class="table-responsive">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>
                    <Text id="integration.matter.settings.node.clusterId" />
                  </th>
                  <th>
                    <Text id="integration.matter.settings.node.clusterName" />
                  </th>
                  <th>
                    <Text id="integration.matter.settings.node.attributes" />
                  </th>
                  <th>
                    <Text id="integration.matter.settings.node.commands" />
                  </th>
                  <th>
                    <Text id="integration.matter.settings.actionsLabel" />
                  </th>
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
                            <Text
                              id={
                                areKeysVisible
                                  ? 'integration.matter.settings.node.hideKeys'
                                  : 'integration.matter.settings.node.showKeys'
                              }
                            />
                          </button>
                        </td>
                      </tr>
                      {areKeysVisible && (
                        <tr>
                          <td colspan="5" class="bg-light">
                            <div class="p-2">
                              <small class="text-muted">
                                <Text id="integration.matter.settings.node.allKeys" />
                              </small>
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

/**
 * @description The expert view of the nodes: their endpoints and clusters, as matter.js sees them.
 */
const MatterExpertTree = ({ nodes, collapsedDevices, visibleKeys, toggleDevice, toggleKeys, getNodeName }) => (
  <div data-cy="matter-expert-tree">
    {nodes.map(node => (
      <div class="card mb-4" key={node.node_id}>
        <div class="card-header">
          <div style="min-width: 0;">
            <h5 class="mb-0">{getNodeName(node)}</h5>
            <small class="text-muted" style="overflow-wrap: break-word;">
              <Text
                id="integration.matter.settings.node.ids"
                fields={{
                  nodeId: node.node_id,
                  vendorId: node.node_information.vendor_id,
                  productId: node.node_information.product_id
                }}
              />
            </small>
          </div>
        </div>
        <div class="card-body">
          {(node.devices || []).map(device => (
            <DeviceDisplay
              device={device}
              nodeId={node.node_id}
              collapsedDevices={collapsedDevices}
              visibleKeys={visibleKeys}
              toggleDevice={toggleDevice}
              toggleKeys={toggleKeys}
            />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default MatterExpertTree;
