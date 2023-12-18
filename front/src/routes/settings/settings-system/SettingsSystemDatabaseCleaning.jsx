import { connect } from 'unistore/preact';
import { Component } from 'preact';
import { Text } from 'preact-i18n';

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

  render({}, { vacuumStarted }) {
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

export default connect('httpClient', null)(SettingsSystemDatabaseCleaning);
