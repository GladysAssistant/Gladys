import { Text } from 'preact-i18n';
import SettingsLayout from '../SettingsLayout';
import GladysPlusUpsellCard from '../../../components/gateway/GladysPlusUpsellCard';

const UpgradePlan = () => (
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
              <Text id="gatewayBackup.youNeedToUpgrade" />
            </p>
            <GladysPlusUpsellCard
              variant="upgrade"
              icon="fe-database"
              utmCampaign="settings_backup_upgrade"
              titleKey="gladysPlusUpsell.backup.upgradeTitle"
              descriptionKey="gladysPlusUpsell.backup.upgradeDescription"
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

export default UpgradePlan;
