import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

const SettingsSystemContainers = ({ systemContainers }) => (
  <div class="card">
    <h4 class="card-header">
      <Text id="systemSettings.containers" />
    </h4>
    <div class="table-responsive" style={{ maxHeight: '200px' }}>
      <table className="table table-hover table-outline table-vcenter text-nowrap card-table">
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
          {systemContainers &&
            systemContainers.map(container => (
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
);

export default connect('systemContainers', null)(SettingsSystemContainers);
