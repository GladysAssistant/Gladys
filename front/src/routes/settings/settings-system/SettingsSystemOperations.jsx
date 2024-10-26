import { connect } from 'unistore/preact';
import { Component } from 'preact';
import { Text } from 'preact-i18n';


class SettingsSystemOperations extends Component {
  constructor(props) {
    super(props);
    this.state = {
      confirmUpdateContainers: false
    };
  }

  updateContainers = async () => {
    this.setState({
      loading: true,
      confirmUpdateContainers: false
    });
    try {
      await this.props.httpClient.post('/api/v1/system/updateContainers');
      // route('/dashboard/settings/jobs');
    } catch (e) {
      console.error(e);
    }
    this.setState({
      loading: false
    });
  };

  toggleUpdateConfirmation = () => {
    this.setState(prevState => {
      return { ...prevState, confirmUpdateContainers: !prevState.confirmUpdateContainers };
    });
  };

  render(props, {confirmUpdateContainers}) {
    return (
      <div class="card">
        <h4 class="card-header">
          <Text id="systemSettings.operations" />
        </h4>

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
            <table className="table table-hover table-outline table-vcenter text-nowrap card-table">
              <tbody>
                <tr>
                  <td>
                    <Text id="systemSettings.upToDate" />
                  </td>
                  <td className="text-right">
                    <span class="badge badge-success">
                      <Text id="systemSettings.gladysVersionValue" fields={{ version: props.systemInfos.gladys_version }} />
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
              {!confirmUpdateContainers ? (
                <button onClick={this.toggleUpdateConfirmation} class="btn btn-info">
                  <Text id="systemSettings.manualUpdateButton" />
                </button>
              ) : (
                <span>
                  <button onClick={this.updateContainers} class="btn btn-primary mr-2">
                    <Text id="systemSettings.confirm" />
                  </button>
                  <button onClick={this.toggleUpdateConfirmation} class="btn btn-danger">
                    <Text id="systemSettings.cancel" />
                  </button>
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', null)(SettingsSystemOperations);


/*
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
*/
