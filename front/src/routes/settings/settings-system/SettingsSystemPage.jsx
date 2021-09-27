import { Text } from 'preact-i18n';
import SettingsLayout from '../SettingsLayout';
import cx from 'classnames';
import Select from 'react-select';

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
        <div class="card">
          <h3 class="card-header">
            <Text id="systemSettings.operations" />
          </h3>

          {props.systemInfos && props.systemInfos.new_release_available === true && (
            <div class="card-body">
              <div>
                <h4>
                  <Text id="systemSettings.newUpgradeAvailable" />
                </h4>
                <p>
                  <Text id="systemSettings.newUpgradeAvailableText" />
                </p>
              </div>
            </div>
          )}

          {props.systemInfos && props.systemInfos.new_release_available === false && (
            <div class="table-responsive">
              <table class="table table-hover table-outline table-vcenter text-nowrap card-table">
                <tbody>
                  <tr>
                    <td>
                      <Text id="systemSettings.upToDate" />
                    </td>
                    <td class="text-right">
                      <span class="badge badge-success">
                        <Text
                          id="systemSettings.gladysVersionValue"
                          fields={{ version: props.systemInfos.gladys_version }}
                        />
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div class="card">
          <h3 class="card-header">
            <Text id="systemSettings.configurationTitle" />
          </h3>
          <div class="card-body">
            <form>
              <label>
                <Text id="systemSettings.timezone" />
              </label>
              <p>
                <small>
                  <Text id="systemSettings.timezoneText" />
                </small>
              </p>
              <Select options={props.timezoneOptions} onChange={props.updateTimezone} value={props.selectedTimezone} />
            </form>
            <form class="mt-4">
              <label>
                <Text id="systemSettings.deviceStateRetentionTime" />
              </label>
              <p>
                <small>
                  <Text id="systemSettings.deviceStateRetentionTimeDescription" />
                </small>
              </p>
              <div class="custom-controls-stacked">
                <label class="custom-control custom-radio">
                  <input
                    type="radio"
                    class="custom-control-input"
                    name="device-state-history-radio"
                    onChange={props.updateDeviceStateHistory}
                    value="7"
                    checked={props.deviceStateHistoryInDays === '7'}
                  />
                  <div class="custom-control-label">
                    <Text id="signup.preferences.deviceStateHistoryDuration.durationOneWeek" />
                  </div>
                </label>
                <label class="custom-control custom-radio">
                  <input
                    type="radio"
                    class="custom-control-input"
                    name="device-state-history-radio"
                    onChange={props.updateDeviceStateHistory}
                    value="30"
                    checked={props.deviceStateHistoryInDays === '30'}
                  />
                  <div class="custom-control-label">
                    <Text id="signup.preferences.deviceStateHistoryDuration.durationOneMonth" />
                  </div>
                </label>
                <label class="custom-control custom-radio">
                  <input
                    type="radio"
                    class="custom-control-input"
                    name="device-state-history-radio"
                    onChange={props.updateDeviceStateHistory}
                    value="90"
                    checked={props.deviceStateHistoryInDays === '90'}
                  />
                  <div class="custom-control-label">
                    <Text id="signup.preferences.deviceStateHistoryDuration.durationThreeMonth" />
                  </div>
                </label>
                <label class="custom-control custom-radio">
                  <input
                    type="radio"
                    class="custom-control-input"
                    name="device-state-history-radio"
                    onChange={props.updateDeviceStateHistory}
                    value="-1"
                    checked={props.deviceStateHistoryInDays === '-1'}
                  />
                  <div class="custom-control-label">
                    <Text id="signup.preferences.deviceStateHistoryDuration.unlimited" />
                  </div>
                </label>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div class="col-lg-6">
        <div class="card">
          <h3 class="card-header">
            <Text id="systemSettings.containers" />
          </h3>
          <div class="table-responsive" style={{ maxHeight: '200px' }}>
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
