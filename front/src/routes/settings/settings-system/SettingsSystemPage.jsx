import { Text } from 'preact-i18n';
import SettingsLayout from '../SettingsLayout';
import SettingsSystemBatteryLevelWarning from './SettingsSystemBatteryLevelWarning';
import SettingsSystemContainers from './SettingsSystemContainers';
import SettingsSystemOperations from './SettingsSystemOperations';
import SettingsSystemTimezone from './SettingsSystemTimezone';
import SettingsSystemKeepDeviceHistory from './SettingsSystemKeepDeviceHistory';
import SettingsSystemKeepAggregatedStates from './SettingsSystemKeepAggregatedStates';
import SettingsSystemTimeExpiryState from './SettingsSystemTimeExpiryState';
import SettingsSystemDatabaseCleaning from './SettingsSystemDatabaseCleaning';

const SystemPage = ({ children, ...props }) => (
  <SettingsLayout>
    <div class="row">
      <div class="col-sm-6 col-lg-3">
        <div class="card p-3">
          <div class="d-flex align-items-center">
            <span class="stamp stamp-md bg-blue mr-3">
              <i class="fe fe-activity" />
            </span>
            <div>
              <h4 class="m-0">
                <Text id="systemSettings.connected" />
              </h4>
              <small class="text-muted">
                <Text id="systemSettings.ping" fields={{ time: props.systemPing }} />
              </small>
            </div>
          </div>
        </div>
      </div>

      <div class="col-sm-6 col-lg-3">
        <div class="card p-3">
          <div class="d-flex align-items-center">
            <span class="stamp stamp-md bg-green mr-3">
              <i class="fe fe-hard-drive" />
            </span>
            <div>
              <h4 class="m-0">
                <Text id="systemSettings.disk" />
              </h4>
              <small class="text-muted">
                <Text
                  id="global.percentValue"
                  fields={{ value: props.systemDiskSpace && Math.ceil(props.systemDiskSpace.capacity * 100) }}
                />
              </small>
            </div>
          </div>
        </div>
      </div>

      <div class="col-sm-6 col-lg-3">
        <div class="card p-3">
          <div class="d-flex align-items-center">
            <span class="stamp stamp-md bg-red mr-3">
              <i class="fe fe-heart" />
            </span>
            <div>
              <h4 class="m-0">
                <Text id="systemSettings.uptime" />
              </h4>
              <small class="text-muted">{props.systemInfos && props.systemInfos.uptime_formatted}</small>
            </div>
          </div>
        </div>
      </div>

      <div class="col-sm-6 col-lg-3">
        <div class="card p-3">
          <div class="d-flex align-items-center">
            <span class="stamp stamp-md bg-yellow mr-3">
              <i class="fe fe-git-commit" />
            </span>
            <div>
              <h4 class="m-0">
                <Text id="systemSettings.gladysVersion" />
              </h4>
              <small class="text-muted">{props.systemInfos && props.systemInfos.gladys_version}</small>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-lg-6">
        <SettingsSystemOperations />
        <SettingsSystemKeepDeviceHistory />
        <SettingsSystemKeepAggregatedStates />
        <SettingsSystemTimeExpiryState />
      </div>
      <div class="col-lg-6">
        <SettingsSystemTimezone />
        <SettingsSystemBatteryLevelWarning />
        <SettingsSystemDatabaseCleaning />
        <SettingsSystemContainers />
      </div>
    </div>
  </SettingsLayout>
);

export default SystemPage;
