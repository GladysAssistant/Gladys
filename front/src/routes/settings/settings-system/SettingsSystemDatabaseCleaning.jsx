import { connect } from 'unistore/preact';
import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';

class SettingsSystemDatabaseCleaning extends Component {
  constructor(props) {
    super(props);
    this.state = {
      vacuumStarted: false
    };
  }

  vacuumDatabase = async e => {
    e.preventDefault();
    this.setState({
      vacuumStarted: true
    });
    try {
      await this.props.httpClient.post('/api/v1/system/vacuum');
    } catch (e) {
      console.error(e);
    }
  };

  vacuumFinished = () => {
    this.setState({
      vacuumStarted: false,
      vacuumFinished: true
    });
  };

  componentDidMount() {
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.SYSTEM.VACUUM_FINISHED, this.vacuumFinished);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.SYSTEM.VACUUM_FINISHED, this.vacuumFinished);
  }

  render({}, { vacuumStarted, vacuumFinished }) {
    return (
      <div class="card">
        <h4 class="card-header">
          <Text id="systemSettings.vacuumDatabaseTitle" />
        </h4>

        <div class="card-body">
          <form className="">
            <p>
              <Text id="systemSettings.vacuumDatabaseDescription" />
            </p>
            <p>
              {vacuumStarted && (
                <div class="alert alert-info">
                  <Text id="systemSettings.vacuumDatabaseStarted" />
                </div>
              )}
              {vacuumFinished && (
                <div class="alert alert-info">
                  <Text id="systemSettings.vacuumDatabaseFinished" />
                </div>
              )}
              <button onClick={this.vacuumDatabase} className="btn btn-primary">
                <Text id="systemSettings.vacuumDatabaseButton" />
              </button>
            </p>
          </form>
        </div>
      </div>
    );
  }
}

export default connect('httpClient,session', null)(SettingsSystemDatabaseCleaning);
