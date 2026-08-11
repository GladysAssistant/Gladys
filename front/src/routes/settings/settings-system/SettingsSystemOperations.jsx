import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import { RequestStatus } from '../../../utils/consts';
import { SYSTEM_UPGRADE_ERROR_CODES } from '../../../../../server/utils/constants';
import style from './style.css';

const SettingsSystemOperations = ({
  systemInfos,
  upgradeGladys,
  SystemUpgradeStatus,
  watchtowerLogs,
  upgradeError,
  websocketConnected,
  SystemGetInfosStatus,
  CheckForUpdatesStatus,
  checkForUpdates,
}) => {
  const imagePinned = systemInfos && systemInfos.docker_image_pinned === true;
  const checkingForUpdates = CheckForUpdatesStatus === RequestStatus.Getting;
  // an error code we don't know how to translate must not leak to the user.
  // hasOwnProperty, so an inherited key like "constructor" cannot pass as valid.
  const upgradeErrorCode =
    upgradeError && Object.prototype.hasOwnProperty.call(SYSTEM_UPGRADE_ERROR_CODES, upgradeError.code)
      ? upgradeError.code
      : SYSTEM_UPGRADE_ERROR_CODES.UNKNOWN_ERROR;

  return (
    <div class="card">
      <div class={SystemGetInfosStatus === RequestStatus.Getting ? 'dimmer active' : 'dimmer'}>
        <div class="loader" />
        <div class="dimmer-content">
          <div class="card-header">
            <h4 class="mb-0">
              <Text id="systemSettings.operations" />
            </h4>
          </div>

          {systemInfos && systemInfos.new_release_available === true && (
            <div class="card-body">
              <div>
                <h4>
                  {systemInfos.latest_gladys_version ? (
                    <Text
                      id="systemSettings.newUpgradeAvailableVersion"
                      fields={{ version: systemInfos.latest_gladys_version }}
                    />
                  ) : (
                    <Text id="systemSettings.newUpgradeAvailable" />
                  )}
                </h4>
                <p>
                  <Text id="systemSettings.newUpgradeAvailableText" />
                </p>
                {imagePinned && (
                  <div class="alert alert-warning">
                    <h4>
                      <Text id="systemSettings.pinnedImageTitle" />
                    </h4>
                    <p>
                      <Text id="systemSettings.pinnedImageText" fields={{ image: systemInfos.docker_image }} />
                    </p>
                    {systemInfos.recommended_docker_image && (
                      <p class="mb-0">
                        <Text
                          id="systemSettings.pinnedImageRecommendation"
                          fields={{ recommendedImage: systemInfos.recommended_docker_image }}
                        />
                      </p>
                    )}
                  </div>
                )}
                {upgradeError && (
                  <div class="alert alert-danger">
                    <Text
                      id={`systemSettings.upgradeError.${upgradeErrorCode}`}
                      fields={{
                        image: upgradeError.image,
                        recommendedImage: upgradeError.recommended_image,
                        statusCode: upgradeError.status_code,
                      }}
                    />
                  </div>
                )}
                {(SystemUpgradeStatus === RequestStatus.Getting || SystemUpgradeStatus === RequestStatus.Success) && (
                  <div class="mt-3">
                    <div class="alert alert-info">
                      <Text id="systemSettings.upgradeInProgress" />
                    </div>
                    {websocketConnected === false && (
                      <div class="alert alert-secondary">
                        <Text id="systemSettings.websocketNotConnected" />
                      </div>
                    )}
                    {watchtowerLogs && watchtowerLogs.length > 0 && (
                      <div class="mt-3">
                        <h5>
                          <Text id="systemSettings.upgradeLogs" />
                        </h5>
                        <div class="card">
                          <div class="card-body p-0">
                            <div
                              class="bg-dark text-light p-3"
                              style={{
                                maxHeight: '300px',
                                overflowY: 'auto',
                                fontFamily: 'monospace',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                              }}
                            >
                              {watchtowerLogs.map((log, index) => (
                                <div key={index} class="mb-1">
                                  {log}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {systemInfos.is_docker === false && (
                  <div class="alert alert-warning">
                    <Text id="systemSettings.notConnectedToDocker" />
                  </div>
                )}
                <button
                  class="btn btn-primary"
                  onClick={upgradeGladys}
                  disabled={
                    SystemUpgradeStatus === RequestStatus.Getting ||
                    SystemUpgradeStatus === RequestStatus.Success ||
                    systemInfos.is_docker === false ||
                    imagePinned
                  }
                >
                  <Text id="systemSettings.updateNow" />
                </button>
              </div>
            </div>
          )}

          {systemInfos && systemInfos.new_release_available === false && (
            <div>
              <div class="table-responsive">
                <table className="table table-hover table-outline table-vcenter text-nowrap card-table">
                  <tbody>
                    <tr>
                      <td>
                        <Text id="systemSettings.upToDate" />
                      </td>
                      <td className="text-right">
                        <span class="badge badge-success">
                          <Text
                            id="systemSettings.gladysVersionValue"
                            fields={{ version: systemInfos.gladys_version }}
                          />
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="card-body">
                <p class="text-muted">
                  <Text id="systemSettings.checkForUpdatesText" />
                </p>
                {CheckForUpdatesStatus === RequestStatus.Success && (
                  <div class="alert alert-success">
                    <Text id="systemSettings.noUpdateAvailable" />
                  </div>
                )}
                {CheckForUpdatesStatus === RequestStatus.Error && (
                  <div class="alert alert-danger">
                    <Text id="systemSettings.checkForUpdatesError" />
                  </div>
                )}
                <button class="btn btn-outline-primary" onClick={checkForUpdates} disabled={checkingForUpdates}>
                  <i class={`fe fe-refresh-cw mr-2 ${checkingForUpdates ? style.spin : ''}`} />
                  <Text
                    id={checkingForUpdates ? 'systemSettings.checkingForUpdates' : 'systemSettings.checkForUpdates'}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default connect('', {})(SettingsSystemOperations);
