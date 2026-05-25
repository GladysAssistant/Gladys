import { Text } from 'preact-i18n';
import SettingsLayout from '../SettingsLayout';
import GladysPlusUpsellCard from '../../../components/gateway/GladysPlusUpsellCard';

const GatewayNotConfigured = () => (
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
            <p>
              <Text id="gatewayBackup.notConfigured" />
            </p>
            <GladysPlusUpsellCard
              icon="fe-database"
              utmCampaign="settings_backup_subscribe"
              titleKey="gladysPlusUpsell.backup.subscribeTitle"
              descriptionKey="gladysPlusUpsell.backup.subscribeDescription"
              featureKeys={[
                'gladysPlusUpsell.backup.feature1',
                'gladysPlusUpsell.backup.feature2',
                'gladysPlusUpsell.backup.feature3'
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  </SettingsLayout>
);

export default GatewayNotConfigured;
