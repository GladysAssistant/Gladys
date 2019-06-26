import { Text } from 'preact-i18n';
import get from 'get-value';

const GatewayConfigured = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="gateway.instanceConfiguredTitle" />
      </h3>
    </div>
    <div class="card-body">
      {!get(props, 'gatewayStatus.connected') && (
        <div class="alert alert-warning">
          <Text id="gateway.yourGatewayIsNotConnected" />
        </div>
      )}
      <p>
        <Text id="gateway.yourGatewayIsConfigured" />
      </p>
      <div class="form-group">
        <label class="form-label">
          <Text id="gateway.instanceRsaKey" />
        </label>
        <input type="text" class="form-control" disabled value={get(props, 'gatewayInstanceKeys.rsa_fingerprint')} />
      </div>
      <div class="form-group">
        <label class="form-label">
          <Text id="gateway.instanceEcdsaKey" />
        </label>
        <input type="text" class="form-control" disabled value={get(props, 'gatewayInstanceKeys.ecdsa_fingerprint')} />
      </div>
    </div>
  </div>
);

export default GatewayConfigured;
