import { Text } from 'preact-i18n';
import { RequestStatus } from '../../../../../utils/consts';

const NetworkTab = ({ children, ...props }) => {
  const zwaveNotConfigured = props.zwaveGetNeighborsStatus === RequestStatus.ServiceNotConfigured;
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
      <div
        id="zwave-network-graph"
        style={{
          width: '100%',
          height: '400px'
        }}
      />
    </div>
  );
};

export default NetworkTab;
