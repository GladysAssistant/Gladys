import { connect } from 'unistore/preact';
import { Component } from 'preact';
import { Text } from 'preact-i18n';

class SettingsSystemOperations extends Component {
  render({ systemInfos }, {}) {
    return (
      <div class="card">
        <h4 class="card-header">
          <Text id="systemSettings.operations" />
        </h4>

        {systemInfos && systemInfos.new_release_available === true && (
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

        {systemInfos && systemInfos.new_release_available === false && (
          <div class="table-responsive">
            <table className="table table-hover table-outline table-vcenter text-nowrap card-table">
              <tbody>
                <tr>
                  <td>
                    <Text id="systemSettings.upToDate" />
                  </td>
                  <td className="text-right">
                    <span class="badge badge-success">
                      <Text id="systemSettings.gladysVersionValue" fields={{ version: systemInfos.gladys_version }} />
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }
}

export default connect('systemInfos', null)(SettingsSystemOperations);
