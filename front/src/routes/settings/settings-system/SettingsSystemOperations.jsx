import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

const SettingsSystemOperations = ({ systemInfos }) => (
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
    <div class="card-body">
      <div class="dimmer-content"> 
        <h5>
          <Text id="systemSettings.manualUpdate" />
        </h5>
        <p>
          <button class="btn btn-primary">
            <Text id="systemSettings.manualUpdateButton" />
          </button>
        </p>
      </div>
    </div>
  </div>
);

export default connect('systemInfos', null)(SettingsSystemOperations);
