import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import SettingsLayout from '../SettingsLayout';
import { RequestStatus } from '../../../utils/consts';
import { SYSTEM_UPGRADE_ERROR_CODES } from '../../../../../server/utils/constants';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import {
  MobileSectionHeader,
  MobileGroup,
  MobileRow,
  MobilePill,
  MobileNotice,
  BigButton,
  ConfirmSheet,
  kitStyle
} from '../../../components/mobile';
import SettingsSystemBatteryLevelWarning from './SettingsSystemBatteryLevelWarning';
import SettingsSystemMessageService from './SettingsSystemMessageService';
import SettingsSystemTimezone from './SettingsSystemTimezone';
import SettingsSystemMdns from './SettingsSystemMdns';
import SettingsSystemKeepDeviceHistory from './SettingsSystemKeepDeviceHistory';
import SettingsSystemTimeExpiryState from './SettingsSystemTimeExpiryState';
import SettingsSystemDatabaseCleaning from './SettingsSystemDatabaseCleaning';
import SettingsSystemDuckDbMigration from './SettingsSystemDuckDbMigration';
import SettingsSystemDownloadLogs from './SettingsSystemDownloadLogs';
import SettingsSystemHostPower from './SettingsSystemHostPower';
import SettingsSystemClock from './SettingsSystemClock';
import style from '../mobileSettings.css';

const getCpuTone = temperature => {
  if (temperature >= 75) {
    return 'danger';
  }
  return temperature >= 60 ? 'warning' : 'success';
};

// The state of the instance at a glance: one row per figure, its value on the right
const MobileSystemStatus = ({ systemPing, systemDiskSpace, systemInfos }) => (
  <MobileGroup data-cy="system-status">
    <MobileRow
      icon="activity"
      title={<Text id="systemSettings.connected" />}
      value={Number.isFinite(systemPing) ? <Text id="systemSettings.ping" fields={{ time: systemPing }} /> : '…'}
    />
    <MobileRow
      icon="hard-drive"
      iconTone="success"
      title={<Text id="systemSettings.disk" />}
      value={
        systemDiskSpace ? (
          <Text id="global.percentValue" fields={{ value: Math.ceil(systemDiskSpace.capacity * 100) }} />
        ) : (
          '…'
        )
      }
    />
    {systemInfos && systemInfos.local_ip && (
      <MobileRow icon="globe" title={<Text id="systemSettings.localIp" />} value={systemInfos.local_ip} />
    )}
    {systemInfos && systemInfos.cpu_temperature != null && (
      <MobileRow
        icon="thermometer"
        iconTone={getCpuTone(systemInfos.cpu_temperature)}
        title={<Text id="systemSettings.cpuTemperature" />}
        value={<Text id="systemSettings.cpuTemperatureValue" fields={{ value: systemInfos.cpu_temperature }} />}
      />
    )}
    <MobileRow
      icon="heart"
      iconTone="danger"
      title={<Text id="systemSettings.uptime" />}
      value={(systemInfos && systemInfos.uptime_formatted) || '…'}
    />
    <MobileRow
      icon="git-commit"
      iconTone="warning"
      title={<Text id="systemSettings.gladysVersion" />}
      value={(systemInfos && systemInfos.gladys_version) || '…'}
    />
  </MobileGroup>
);

// Updates: what the "Operations" card says, with an update that is confirmed (Gladys restarts)
class MobileSystemOperationsComponent extends Component {
  state = {
    confirmOpen: false
  };

  askUpgrade = () => this.setState({ confirmOpen: true });
  cancelUpgrade = () => this.setState({ confirmOpen: false });
  confirmUpgrade = () => {
    this.setState({ confirmOpen: false });
    this.props.upgradeGladys();
  };

  render(
    {
      systemInfos,
      SystemUpgradeStatus,
      watchtowerLogs,
      upgradeError,
      websocketConnected,
      SystemGetInfosStatus,
      CheckForUpdatesStatus,
      checkForUpdates,
      intl
    },
    { confirmOpen }
  ) {
    if (!systemInfos) {
      return SystemGetInfosStatus === RequestStatus.Getting ? (
        <div class="dimmer active">
          <div class="loader" />
          <div class={`dimmer-content ${style.loading}`} />
        </div>
      ) : null;
    }
    const imagePinned = systemInfos.docker_image_pinned === true;
    const checkingForUpdates = CheckForUpdatesStatus === RequestStatus.Getting;
    const upgrading = SystemUpgradeStatus === RequestStatus.Getting || SystemUpgradeStatus === RequestStatus.Success;
    // an error code we don't know how to translate must not leak to the user
    const upgradeErrorCode =
      upgradeError && Object.prototype.hasOwnProperty.call(SYSTEM_UPGRADE_ERROR_CODES, upgradeError.code)
        ? upgradeError.code
        : SYSTEM_UPGRADE_ERROR_CODES.UNKNOWN_ERROR;

    if (systemInfos.new_release_available === true) {
      return (
        <div data-cy="system-operations">
          <MobileNotice icon="download-cloud">
            <strong>
              {systemInfos.latest_gladys_version ? (
                <Text
                  id="systemSettings.newUpgradeAvailableVersion"
                  fields={{ version: systemInfos.latest_gladys_version }}
                />
              ) : (
                <Text id="systemSettings.newUpgradeAvailable" />
              )}
            </strong>
            <div>
              <Text id="systemSettings.newUpgradeAvailableText" />
            </div>
          </MobileNotice>
          {imagePinned && (
            <MobileNotice tone="warning" icon="alert-triangle">
              <strong>
                <Text id="systemSettings.pinnedImageTitle" />
              </strong>
              <div>
                <Text id="systemSettings.pinnedImageText" fields={{ image: systemInfos.docker_image }} />
              </div>
              {systemInfos.recommended_docker_image && (
                <div>
                  <Text
                    id="systemSettings.pinnedImageRecommendation"
                    fields={{ recommendedImage: systemInfos.recommended_docker_image }}
                  />
                </div>
              )}
            </MobileNotice>
          )}
          {upgradeError && (
            <MobileNotice tone="danger" icon="alert-circle" data-cy="system-upgrade-error">
              <Text
                id={`systemSettings.upgradeError.${upgradeErrorCode}`}
                fields={{
                  image: upgradeError.image,
                  recommendedImage: upgradeError.recommended_image,
                  statusCode: upgradeError.status_code,
                  message: upgradeError.message
                }}
              />
            </MobileNotice>
          )}
          {upgrading && (
            <div>
              <MobileNotice icon="loader" data-cy="system-upgrade-in-progress">
                <Text id="systemSettings.upgradeInProgress" />
              </MobileNotice>
              {websocketConnected === false && (
                <MobileNotice tone="warning" icon="wifi-off">
                  <Text id="systemSettings.websocketNotConnected" />
                </MobileNotice>
              )}
              {watchtowerLogs && watchtowerLogs.length > 0 && (
                <div>
                  <MobileSectionHeader title={<Text id="systemSettings.upgradeLogs" />} />
                  <div class={style.logs} data-cy="system-upgrade-logs">
                    {watchtowerLogs.map((log, index) => (
                      <div key={index}>{log}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {systemInfos.is_docker === false && (
            <MobileNotice tone="warning" icon="alert-triangle">
              <Text id="systemSettings.notConnectedToDocker" />
            </MobileNotice>
          )}
          <BigButton
            variant="primary"
            icon="download"
            onClick={this.askUpgrade}
            disabled={upgrading || systemInfos.is_docker === false || imagePinned}
            data-cy="system-update-now"
          >
            <Text id="systemSettings.updateNow" />
          </BigButton>
          <ConfirmSheet
            open={confirmOpen}
            title={get(intl.dictionary, 'systemSettings.mobile.updateTitle')}
            text={<Text id="systemSettings.mobile.updateText" />}
            confirmLabel={<Text id="systemSettings.updateNow" />}
            onConfirm={this.confirmUpgrade}
            onCancel={this.cancelUpgrade}
            dataCy="system-update-confirm"
          />
        </div>
      );
    }

    if (systemInfos.new_release_available === false) {
      return (
        <div data-cy="system-operations">
          <MobileGroup>
            <MobileRow
              icon="check"
              iconTone="success"
              title={<Text id="systemSettings.upToDate" />}
              trailing={
                <MobilePill tone="success">
                  <Text id="systemSettings.gladysVersionValue" fields={{ version: systemInfos.gladys_version }} />
                </MobilePill>
              }
            />
          </MobileGroup>
          <p class={kitStyle.footnote}>
            <Text id="systemSettings.mobile.checkForUpdatesText" />
          </p>
          <div class={style.blockTop}>
            {CheckForUpdatesStatus === RequestStatus.Success && (
              <MobileNotice tone="success" icon="check" data-cy="system-no-update">
                <Text id="systemSettings.noUpdateAvailable" />
              </MobileNotice>
            )}
            {CheckForUpdatesStatus === RequestStatus.Error && (
              <MobileNotice tone="danger" icon="alert-circle">
                <Text id="systemSettings.checkForUpdatesError" />
              </MobileNotice>
            )}
            <BigButton onClick={checkForUpdates} disabled={checkingForUpdates} data-cy="system-check-updates">
              <i class={cx('fe', 'fe-refresh-cw', { [style.spin]: checkingForUpdates })} aria-hidden="true" />
              <Text id={checkingForUpdates ? 'systemSettings.checkingForUpdates' : 'systemSettings.checkForUpdates'} />
            </BigButton>
          </div>
        </div>
      );
    }
    return null;
  }
}

const MobileSystemOperations = withIntlAsProp(MobileSystemOperationsComponent);

// The containers: the rows of the desktop card, in the flow of the page (no scroll box)
const MobileSystemContainers = connect(
  'systemContainers',
  null
)(({ systemContainers }) => {
  if (!systemContainers || systemContainers.length === 0) {
    return null;
  }
  return (
    <div>
      <MobileSectionHeader title={<Text id="systemSettings.containers" />} />
      <MobileGroup data-cy="system-containers">
        {systemContainers.map(container => (
          <MobileRow
            key={container.id}
            icon="box"
            title={container.name}
            subtitle={container.created_at_formatted}
            trailing={
              <MobilePill tone={container.state === 'running' ? 'success' : 'warning'}>
                <Text id={`systemSettings.containerState.${container.state}`}>{container.state}</Text>
              </MobilePill>
            }
          />
        ))}
      </MobileGroup>
    </div>
  );
});

/**
 * @description The System page on a phone (docs/specs/mobile-pages/settings-pages.md, F): the
 * state of the instance as rows, the updates, the containers, then the preferences and the
 * maintenance — the cards of the desktop page, in one column and dressed for a thumb. Same
 * container, same card components.
 */
const MobileSystemPage = ({ children, ...props }) => (
  <SettingsLayout>
    <div class={style.page} data-cy="system-mobile">
      <MobileSectionHeader title={<Text id="systemSettings.mobile.statusTitle" />} />
      <MobileSystemStatus
        systemPing={props.systemPing}
        systemDiskSpace={props.systemDiskSpace}
        systemInfos={props.systemInfos}
      />

      <MobileSectionHeader title={<Text id="systemSettings.mobile.updatesTitle" />} />
      <MobileSystemOperations
        upgradeGladys={props.upgradeGladys}
        SystemUpgradeStatus={props.SystemUpgradeStatus}
        watchtowerLogs={props.watchtowerLogs}
        upgradeError={props.upgradeError}
        websocketConnected={props.websocketConnected}
        checkForUpdates={props.checkForUpdates}
        SystemGetInfosStatus={props.SystemGetInfosStatus}
        CheckForUpdatesStatus={props.CheckForUpdatesStatus}
        systemInfos={props.systemInfos}
      />

      <MobileSystemContainers />

      <MobileSectionHeader title={<Text id="systemSettings.mobile.preferencesTitle" />} />
      <div class={style.cards} data-cy="system-preferences">
        <SettingsSystemTimezone />
        <SettingsSystemClock />
        <SettingsSystemMdns systemInfos={props.systemInfos} />
        <SettingsSystemBatteryLevelWarning />
        <SettingsSystemMessageService />
        <SettingsSystemKeepDeviceHistory />
        <SettingsSystemTimeExpiryState />
      </div>

      <MobileSectionHeader title={<Text id="systemSettings.mobile.maintenanceTitle" />} />
      <div class={style.cards} data-cy="system-maintenance">
        <SettingsSystemDownloadLogs />
        <SettingsSystemDatabaseCleaning />
        <SettingsSystemDuckDbMigration />
        <SettingsSystemHostPower systemInfos={props.systemInfos} />
      </div>
    </div>
  </SettingsLayout>
);

export default MobileSystemPage;
