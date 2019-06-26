import { Text } from 'preact-i18n';
import SettingsLayout from '../SettingsLayout';
import cx from 'classnames';

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
                {props.systemPing} ms <Text id="systemSettings.ping" />
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
              <small class="text-muted">{props.systemDiskSpace && props.systemDiskSpace.capacity * 100}%</small>
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
        <div class="card">
          <h3 class="card-header">
            <Text id="systemSettings.operations" />
          </h3>
          <div class="table-responsive">
            <table class="table table-hover table-outline table-vcenter text-nowrap card-table">
              <tbody>
                {props.upgradeAvailable && props.isDocker && (
                  <tr>
                    <td>
                      <Text id="systemSettings.newUpgradeAvailable" />
                    </td>
                    <td class="text-right">
                      <button onClick={props.downloadUpgrade} class="btn btn-success btn-sm">
                        <Text id="systemSettings.download" /> {props.systemInfos.latest_gladys_version}
                      </button>
                    </td>
                  </tr>
                )}
                {props.upgradeAvailable && !props.isDocker && (
                  <tr>
                    <td>
                      <Text id="systemSettings.newUpgradeAvailable" />
                    </td>
                    <td class="text-right">
                      <span class="badge badge-warning">
                        <Text id="systemSettings.notAvailable" />
                      </span>
                    </td>
                  </tr>
                )}
                {props.upgradeDownloadInProgress && (
                  <tr>
                    <td>
                      <Text id="systemSettings.newUpgradeAvailable" />
                    </td>
                    <td>
                      <div>
                        <div class="clearfix">
                          <div class="float-left">
                            <strong>{props.downloadUpgradeProgress}%</strong>
                          </div>
                        </div>
                        <div class="progress progress-sm">
                          <div
                            class="progress-bar bg-green"
                            style={{
                              width: `${props.downloadUpgradeProgress}%`
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                )}

                {props.upgradeDownloadFinished && (
                  <tr>
                    <td>
                      <Text id="systemSettings.downloadFinished" />
                    </td>
                    <td class="text-right">
                      <span class="badge badge-success">
                        <Text id="systemSettings.restartingGladys" />
                      </span>
                    </td>
                  </tr>
                )}

                {props.systemInfos && props.systemInfos.new_release_available === false && (
                  <tr>
                    <td>
                      <Text id="systemSettings.upToDate" />
                    </td>
                    <td class="text-right">
                      <span class="badge badge-success">Gladys {props.systemInfos.gladys_version}</span>
                    </td>
                  </tr>
                )}

                {props.systemInfos && props.systemInfos.is_docker === true && (
                  <tr>
                    <td>
                      <Text id="systemSettings.restartGladys" />
                    </td>
                    <td class="text-right">
                      <button class="btn btn-warning btn-sm">
                        <Text id="systemSettings.restartButton" />
                      </button>
                    </td>
                  </tr>
                )}
                {props.systemInfos && props.systemInfos.is_docker === false && (
                  <tr>
                    <td>
                      <Text id="systemSettings.restartGladys" />
                    </td>
                    <td class="text-right">
                      <span class="badge badge-warning">
                        <Text id="systemSettings.notAvailable" />
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="col-lg-6">
        <div class="card">
          <h3 class="card-header">
            <Text id="systemSettings.containers" />
          </h3>
          <div class="table-responsive">
            <table class="table table-hover table-outline table-vcenter text-nowrap card-table">
              <thead>
                <tr>
                  <th>
                    <Text id="systemSettings.containerName" />
                  </th>
                  <th>
                    <Text id="systemSettings.containerCreated" />
                  </th>
                  <th>
                    <Text id="systemSettings.containerStatus" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {props.systemContainers &&
                  props.systemContainers.map(container => (
                    <tr>
                      <td>{container.name}</td>
                      <td>{container.created_at_formatted}</td>
                      <td>
                        <span
                          class={cx('badge', {
                            'badge-success': container.state === 'running',
                            'badge-warning': container.state !== 'running'
                          })}
                        >
                          <Text id={`systemSettings.containerState.${container.state}`} />
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </SettingsLayout>
);

export default SystemPage;
