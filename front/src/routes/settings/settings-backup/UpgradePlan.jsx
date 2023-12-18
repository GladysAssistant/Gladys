import { Text } from 'preact-i18n';
import SettingsLayout from '../SettingsLayout';

const GatewayPage = ({}) => (
  <SettingsLayout>
    <div class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h2 class="page-title">
              <Text id="gatewayBackup.title" />
            </h2>
          </div>
          <div class="card-body">
            <Text id="gatewayBackup.youNeedToUpgrade" />
          </div>
        </div>
      </div>
    </div>
  </SettingsLayout>
);

export default GatewayPage;
