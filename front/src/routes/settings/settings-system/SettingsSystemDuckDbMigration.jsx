import { connect } from 'unistore/preact';
import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import { route } from 'preact-router';

class SettingsSystemDuckDbMigration extends Component {
  constructor(props) {
    super(props);
    this.state = {
      confirmRestartingMigration: false,
      confirmPurgingSQlite: false
    };
  }

  getDuckDbMigrationState = async () => {
    this.setState({
      loading: true
    });
    try {
      const migrationState = await this.props.httpClient.get('/api/v1/device/duckdb_migration_state');
      // Format with thousand separator
      migrationState.sqlite_db_device_state_count = new Intl.NumberFormat(this.props.user.language).format(
        migrationState.sqlite_db_device_state_count
      );
      migrationState.duck_db_device_count = new Intl.NumberFormat(this.props.user.language).format(
        migrationState.duck_db_device_count
      );
      this.setState({ migrationState });
    } catch (e) {
      console.error(e);
    }
    this.setState({
      loading: false
    });
  };

  migrateToDuckDb = async () => {
    this.setState({
      loading: true,
      confirmRestartingMigration: false
    });
    try {
      await this.props.httpClient.post('/api/v1/device/migrate_from_sqlite_to_duckdb');
      route('/dashboard/settings/jobs');
    } catch (e) {
      console.error(e);
    }
    this.setState({
      loading: false
    });
  };

  purgeAllSqliteStates = async () => {
    this.setState({
      loading: true,
      confirmPurgingSQlite: false
    });
    try {
      await this.props.httpClient.post('/api/v1/device/purge_all_sqlite_state');
      route('/dashboard/settings/jobs');
    } catch (e) {
      console.error(e);
    }
    this.setState({
      loading: false
    });
  };

  togglePurgeConfirmation = () => {
    this.setState(prevState => {
      return { ...prevState, confirmPurgingSQlite: !prevState.confirmPurgingSQlite };
    });
  };

  toggleMigrationConfirmation = () => {
    this.setState(prevState => {
      return { ...prevState, confirmRestartingMigration: !prevState.confirmRestartingMigration };
    });
  };

  componentDidMount() {
    this.getDuckDbMigrationState();
  }

  render({}, { loading, migrationState, confirmRestartingMigration, confirmPurgingSQlite }) {
    return (
      <div class="card">
        <h4 class="card-header">
          <Text id="systemSettings.duckDbMigrationTitle" />
        </h4>

        <div class="card-body">
          <div
            class={cx('dimmer', {
              active: loading
            })}
          >
            <div class="loader py-3" />
            <div class="dimmer-content">
              <p>
                <Text id="systemSettings.duckDbMigrationDescription" />
              </p>
              <h5>
                <Text id="systemSettings.duckDbMigrationProgressTitle" />
              </h5>
              {migrationState && (
                <ul>
                  <li>
                    <b>
                      <Text id="systemSettings.duckDbMigrationMigrationDone" />
                    </b>{' '}
                    {migrationState.is_duck_db_migrated ? (
                      <span class="badge badge-info">
                        <Text id="global.yes" />
                      </span>
                    ) : (
                      <span class="badge badge-danger">
                        <Text id="global.no" />
                      </span>
                    )}
                  </li>
                  <li>
                    <b>
                      <Text id="systemSettings.duckDbNumberOfStatesinSQlite" />
                    </b>{' '}
                    : {migrationState.sqlite_db_device_state_count}
                  </li>
                  <li>
                    <b>
                      <Text id="systemSettings.duckDbNumberOfStatesinDuckDb" />
                    </b>{' '}
                    : {migrationState.duck_db_device_count}
                  </li>
                </ul>
              )}
              <h5>
                <Text id="systemSettings.restartMigrationTitle" />
              </h5>
              <p>
                {!confirmRestartingMigration ? (
                  <button onClick={this.toggleMigrationConfirmation} class="btn btn-primary">
                    <Text id="systemSettings.restartMigrationTitle" />
                  </button>
                ) : (
                  <span>
                    <button onClick={this.migrateToDuckDb} class="btn btn-primary mr-2">
                      <Text id="systemSettings.confirm" />
                    </button>
                    <button onClick={this.toggleMigrationConfirmation} class="btn btn-danger">
                      <Text id="systemSettings.cancel" />
                    </button>
                  </span>
                )}
              </p>
              <h5>
                <Text id="systemSettings.purgeSQliteTitle" />
              </h5>
              <p>
                {!confirmPurgingSQlite ? (
                  <button
                    onClick={this.togglePurgeConfirmation}
                    class="btn btn-danger"
                    disabled={migrationState && !migrationState.is_duck_db_migrated}
                  >
                    <Text id="systemSettings.purgeSQliteTitle" />
                  </button>
                ) : (
                  <span>
                    <button onClick={this.purgeAllSqliteStates} class="btn btn-primary mr-2">
                      <Text id="systemSettings.confirm" />
                    </button>
                    <button onClick={this.togglePurgeConfirmation} class="btn btn-danger">
                      <Text id="systemSettings.cancel" />
                    </button>
                  </span>
                )}
              </p>
              <p>
                <Text id="systemSettings.purgeSQliteDescription" />
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient,user', null)(SettingsSystemDuckDbMigration);
