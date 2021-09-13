import { Text } from 'preact-i18n';
import { RequestStatus } from '../../../../../utils/consts';

const NetworkTab = ({ children, ...props }) => {
  const zwaveNotConfigured = props.zwaveGetNeighborsStatus === RequestStatus.ServiceNotConfigured;
  const { zwaveNodesNeighbors } = props;

  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <Text id="integration.zwave.network.title" />
        </h3>
      </div>
      {zwaveNotConfigured && (
        <div class="alert alert-warning">
          <Text id="integration.zwave.setup.zwaveNotConfiguredError" />
        </div>
      )}
      <table class="table card-table table-vcenter">
        <thead>
          <tr>
            <th>
              <Text id="integration.zwave.network.nodeId" />
            </th>
            <th>
              <Text id="integration.zwave.network.nodeName" />
            </th>
            <th>
              <Text id="integration.zwave.network.nodeNeighbors" />
            </th>
          </tr>
        </thead>
        <tbody>
          {zwaveNodesNeighbors &&
            zwaveNodesNeighbors.map(node => (
              <tr>
                <td>{node.id}</td>
                <td>
                  {node.product}
                  {!node.product && (
                    <span class="badge badge-warning">
                      <Text id="integration.zwave.network.nodeAsleep" />
                    </span>
                  )}
                </td>
                <td>
                  {node.neighbors.map(neighbor => (
                    <span class="badge badge-secondary mr-2">
                      <Text id="integration.zwave.network.node" /> {neighbor}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default NetworkTab;
