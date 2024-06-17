import get from 'get-value';
import SettingsLayout from '../SettingsLayout';
import GatewayBackupList from './GatewayBackupList';
import GatewayRestoreInProgress from './GatewayRestoreInProgress';

const GatewayPage = ({ children, ...props }) => (
  <SettingsLayout>
    <div class="row">
      <div class="col-md-12">
        {!props.gatewayRestoreInProgress && get(props, 'gatewayStatus.configured') === true && (
          <GatewayBackupList {...props} />
        )}
        {props.gatewayRestoreInProgress && get(props, 'gatewayStatus.configured') === true && (
          <GatewayRestoreInProgress gatewayGladysRestarting={props.gatewayGladysRestarting} />
        )}
      </div>
    </div>
  </SettingsLayout>
);

export default GatewayPage;
