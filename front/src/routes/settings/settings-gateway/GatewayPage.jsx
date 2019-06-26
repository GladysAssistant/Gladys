import { Text } from 'preact-i18n';

import get from 'get-value';

import SettingsLayout from '../SettingsLayout';
import GatewayLoginForm from './GatewayLoginForm';
import GatewayPricing from './GatewayPricing';
import GatewayConfigured from './GatewayConfigured';
import GatewayUsersList from './GatewayUsersList';

const GatewayPage = ({ children, ...props }) => (
  <SettingsLayout>
    {get(props, 'gatewayStatus.configured') === false && !props.displayGatewayLogin && <GatewayPricing {...props} />}
    {props.displayGatewayLogin && (
      <div>
        <div class="row">
          <button onClick={props.cancelGatewayLogin} class="btn btn-secondary btn-sm">
            ◀️️ Back
          </button>
        </div>
        <div class="row mt-4">
          <div class="col-md-6 offset-md-3">
            <GatewayLoginForm {...props} />
          </div>
        </div>
      </div>
    )}
    {get(props, 'gatewayStatus.configured') === true && (
      <div class="row">
        <div class="col-md-12">
          <GatewayConfigured {...props} />
        </div>
        <div class="col-md-12">
          <GatewayUsersList {...props} />
        </div>
      </div>
    )}
  </SettingsLayout>
);

export default GatewayPage;
