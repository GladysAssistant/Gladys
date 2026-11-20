import get from 'get-value';
import SettingsLayout from '../SettingsLayout';
import GatewayBackupList from './GatewayBackupList';
import MobileBackupList from './MobileBackupList';
import GatewayRestoreInProgress from './GatewayRestoreInProgress';
import { withMobileViewport } from '../../../components/mobile';

// On a phone the backups are rows and a restoration is confirmed in a sheet
// (docs/specs/mobile-pages/settings-pages.md, E): same props, same actions
const GatewayPage = ({ children, isMobile, ...props }) => {
  const BackupList = isMobile ? MobileBackupList : GatewayBackupList;
  return (
    <SettingsLayout>
      <div class="row">
        <div class="col-md-12">
          {!props.gatewayRestoreInProgress && get(props, 'gatewayStatus.configured') === true && (
            <BackupList {...props} />
          )}
          {props.gatewayRestoreInProgress && get(props, 'gatewayStatus.configured') === true && (
            <GatewayRestoreInProgress gatewayGladysRestarting={props.gatewayGladysRestarting} />
          )}
        </div>
      </div>
    </SettingsLayout>
  );
};

export default withMobileViewport(GatewayPage);
