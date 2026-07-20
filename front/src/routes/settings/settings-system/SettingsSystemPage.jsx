import { Text } from 'preact-i18n';
import SettingsLayout from '../SettingsLayout';
import SettingsSystemBatteryLevelWarning from './SettingsSystemBatteryLevelWarning';
import SettingsSystemContainers from './SettingsSystemContainers';
import SettingsSystemOperations from './SettingsSystemOperations';
import SettingsSystemTimezone from './SettingsSystemTimezone';
import SettingsSystemKeepDeviceHistory from './SettingsSystemKeepDeviceHistory';
import SettingsSystemTimeExpiryState from './SettingsSystemTimeExpiryState';
import SettingsSystemDatabaseCleaning from './SettingsSystemDatabaseCleaning';
import SettingsSystemDuckDbMigration from './SettingsSystemDuckDbMigration';
import SettingsSystemDownloadLogs from './SettingsSystemDownloadLogs';

const SystemPage = ({ children, ...props }) => (
  <SettingsLayout>
    <div class="row">
      <div class="col-sm-6 col-lg">
        <div class="card p-3">
          <div class="d-flex flex-row align-items-center flex-sm-column">
            <span class="stamp stamp-md bg-blue mr-3 mr-sm-0 mb-sm-2">
              <i class="fe fe-activity" />
            </span>
            <div class="text-sm-center">
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

      <div class="col-sm-6 col-lg">
        <div class="card p-3">
          <div class="d-flex flex-row align-items-center flex-sm-column">
            <span class="stamp stamp-md bg-green mr-3 mr-sm-0 mb-sm-2">
              <i class="fe fe-hard-drive" />
            </span>
            <div class="text-sm-center">
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

      {props.systemInfos && props.systemInfos.cpu_temperature != null && (
        <div class="col-sm-6 col-lg">
          <div class="card p-3">
            <div class="d-flex flex-row align-items-center flex-sm-column">
              <span
                class={`stamp stamp-md mr-3 mr-sm-0 mb-sm-2 ${
                  props.systemInfos.cpu_temperature >= 75
                    ? 'bg-red'
                    : props.systemInfos.cpu_temperature >= 60
                    ? 'bg-orange'
                    : 'bg-green'
                }`}
              >
                <i class="fe fe-thermometer" />
              </span>
              <div class="text-sm-center">
                <h4 class="m-0">
                  <Text id="systemSettings.cpuTemperature" />
                </h4>
                <small class="text-muted">
                  <Text id="systemSettings.cpuTemperatureValue" fields={{ value: props.systemInfos.cpu_temperature }} />
                </small>
              </div>
            </div>
          </div>
        </div>
      )}

      <div class="col-sm-6 col-lg">
        <div class="card p-3">
          <div class="d-flex flex-row align-items-center flex-sm-column">
            <span class="stamp stamp-md bg-red mr-3 mr-sm-0 mb-sm-2">
              <i class="fe fe-heart" />
            </span>
            <div class="text-sm-center">
              <h4 class="m-0">
                <Text id="systemSettings.uptime" />
              </h4>
              <small class="text-muted">{props.systemInfos && props.systemInfos.uptime_formatted}</small>
            </div>
          </div>
        </div>
      </div>

      <div class="col-sm-6 col-lg">
        <div class="card p-3">
          <div class="d-flex flex-row align-items-center flex-sm-column">
            <span class="stamp stamp-md bg-yellow mr-3 mr-sm-0 mb-sm-2">
              <i class="fe fe-git-commit" />
            </span>
            <div class="text-sm-center">
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
        <SettingsSystemOperations
          upgradeGladys={props.upgradeGladys}
          SystemUpgradeStatus={props.SystemUpgradeStatus}
          watchtowerLogs={props.watchtowerLogs}
          websocketConnected={props.websocketConnected}
          checkForUpdates={props.checkForUpdates}
          SystemGetInfosStatus={props.SystemGetInfosStatus}
          systemInfos={props.systemInfos}
        />
        <SettingsSystemDuckDbMigration />
        <SettingsSystemKeepDeviceHistory />
        <SettingsSystemTimeExpiryState />
      </div>
      <div class="col-lg-6">
        <SettingsSystemTimezone />
        <SettingsSystemBatteryLevelWarning />
        <SettingsSystemDownloadLogs />
        <SettingsSystemDatabaseCleaning />
        <SettingsSystemContainers />
      </div>
    </div>
  </SettingsLayout>
);

export default SystemPage;
