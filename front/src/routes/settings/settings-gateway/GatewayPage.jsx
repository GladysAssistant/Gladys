import get from 'get-value';
import { Text } from 'preact-i18n';

import SettingsLayout from '../SettingsLayout';
import GatewayLoginForm from '../../../components/gateway/GatewayLoginForm';
import GatewayPricing from './GatewayPricing';
import GatewayConfigured from './GatewayConfigured';
import GatewayBackupKey from './GatewayBackupKey';
import GatewayUsersList from './GatewayUsersList';
import GatewayDisconnect from './GatewayDisconnect';
import GatewayConnectedSuccess from './GatewayConnectedSuccess';

const GatewayPage = ({ children, ...props }) => (
  <SettingsLayout>
    {get(props, 'gatewayStatus.configured') === false && !props.displayGatewayLogin && <GatewayPricing {...props} />}
    {props.displayGatewayLogin && (
      <div>
        <div class="row">
          <button onClick={props.cancelGatewayLogin} class="btn btn-secondary btn-sm">
            <Text id="global.backButton" />
          </button>
        </div>
        <div class="row mt-4">
          <div class="col-md-6 offset-md-3">
            <GatewayLoginForm {...props} external_forgot_password />
          </div>
        </div>
      </div>
    )}
    {props.displayConnectedSuccess && (
      <div class="row">
        <div class="col-md-12">
          <GatewayConnectedSuccess
            gatewayBackupKey={props.gatewayBackupKey}
            finalizeGatewaySetup={props.finalizeGatewaySetup}
          />
        </div>
      </div>
    )}
    {!props.displayConnectedSuccess && get(props, 'gatewayStatus.configured') === true && (
      <div class="row">
        <div class="col-md-12">
          <GatewayConfigured {...props} />
        </div>
        <div class="col-md-12">
          <GatewayUsersList {...props} />
        </div>
        <div class="col-md-12">
          <GatewayBackupKey {...props} />
        </div>
        <div class="col-md-12">
          <GatewayDisconnect gatewayDisconnectStatus={props.gatewayDisconnectStatus} disconnect={props.disconnect} />
        </div>
      </div>
    )}
  </SettingsLayout>
);

export default GatewayPage;
