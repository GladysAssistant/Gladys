import SettingsLayout from '../SettingsLayout';
import GatewayBackupList from './GatewayBackupList';
import GatewayRestoreInProgress from './GatewayRestoreInProgress';

const GatewayPage = ({ children, ...props }) => (
  <SettingsLayout>
    <div class="row">
      <div class="col-md-12">
        {!props.gatewayRestoreInProgress && <GatewayBackupList {...props} />}
        {props.gatewayRestoreInProgress && <GatewayRestoreInProgress />}
      </div>
    </div>
  </SettingsLayout>
);

export default GatewayPage;
