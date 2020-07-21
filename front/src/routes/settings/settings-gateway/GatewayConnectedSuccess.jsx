import { Localizer, Text } from 'preact-i18n';
import get from 'get-value';

const GatewayConnectedSuccess = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="gateway.gatewayConnectedSuccessTitle" />
      </h3>
    </div>
    <div class="card-body">
      <p>
        <Text id="gateway.gatewayConnectedSuccessDescription" />
      </p>
      <p>
        <Text id="gateway.gatewayConnectedSuccessBackupKey" />
      </p>

      <div class="form-group">
        <label class="form-label">
          <Text id="gateway.backupKeyLabel" />
        </label>
        <Localizer>
          <input
            type="text"
            class="form-control"
            disabled
            placeholder={<Text id="gateway.backupKeyPlaceholder" />}
            value={get(props, 'gatewayBackupKey')}
          />
        </Localizer>
      </div>
      <div class="form-group">
        <button class="btn btn-success" onClick={props.finalizeGatewaySetup}>
          <Text id="gateway.gatewayConnectedSuccessButton" />
        </button>
      </div>
    </div>
  </div>
);

export default GatewayConnectedSuccess;
