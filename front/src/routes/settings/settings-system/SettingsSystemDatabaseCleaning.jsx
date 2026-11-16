import { connect } from 'unistore/preact';
import { Component } from 'preact';
import { Text } from 'preact-i18n';
import get from 'get-value';

import withIntlAsProp from '../../../utils/withIntlAsProp';
import { withMobileViewport, ConfirmSheet } from '../../../components/mobile';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';

const formatDuration = duration => {
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((duration % (1000 * 60)) / 1000);
  const milliseconds = duration % 1000;
  return `${hours}h ${minutes}m ${seconds}s ${milliseconds}ms`;
};

class SettingsSystemDatabaseCleaning extends Component {
  constructor(props) {
    super(props);
    this.state = {
      vacuumStarted: false
    };
  }

  // On a phone the cleaning is confirmed first: Gladys is unavailable while it runs
  askVacuumConfirmation = e => {
    e.preventDefault();
    this.setState({ confirmOpen: true });
  };

  cancelVacuum = () => this.setState({ confirmOpen: false });

  vacuumDatabase = async e => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    // one request, however many taps the confirmation gets before it closes
    if (this.vacuumRequested) {
      return;
    }
    this.vacuumRequested = true;
    this.setState({
      confirmOpen: false,
      vacuumStarted: true,
      vacuumFailed: false
    });
    try {
      await this.props.httpClient.post('/api/v1/system/vacuum');
    } catch (e) {
      console.error(e);
      // the cleaning did not start: no "finished" message will come to give the button back
      this.setState({ vacuumStarted: false, vacuumFailed: true });
    } finally {
      this.vacuumRequested = false;
    }
  };

  vacuumFinished = payload => {
    this.setState({
      vacuumStarted: false,
      vacuumFinished: true,
      vacuumDuration: payload.duration
    });
  };

  componentDidMount() {
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.SYSTEM.VACUUM_FINISHED, this.vacuumFinished);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.SYSTEM.VACUUM_FINISHED, this.vacuumFinished);
  }

  render({ isMobile, intl }, { vacuumStarted, vacuumFinished, vacuumFailed, vacuumDuration, confirmOpen }) {
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
              {vacuumFailed && (
                <div class="alert alert-danger" role="alert" data-cy="system-vacuum-error">
                  <Text id="systemSettings.vacuumDatabaseError" />
                </div>
              )}
              {vacuumFinished && (
                <div class="alert alert-info">
                  <Text
                    id="systemSettings.vacuumDatabaseFinished"
                    fields={{ duration: formatDuration(vacuumDuration) }}
                  />
                </div>
              )}
              <button
                onClick={isMobile ? this.askVacuumConfirmation : this.vacuumDatabase}
                className="btn btn-primary"
                disabled={isMobile && vacuumStarted}
                data-cy="system-vacuum"
              >
                <Text id="systemSettings.vacuumDatabaseButton" />
              </button>
            </p>
          </form>
        </div>
        {isMobile && (
          <ConfirmSheet
            open={Boolean(confirmOpen)}
            title={get(intl.dictionary, 'systemSettings.mobile.vacuumTitle')}
            text={<Text id="systemSettings.mobile.vacuumText" />}
            confirmLabel={<Text id="systemSettings.vacuumDatabaseButton" />}
            onConfirm={this.vacuumDatabase}
            onCancel={this.cancelVacuum}
            dataCy="system-vacuum-confirm"
          />
        )}
      </div>
    );
  }
}

export default connect('httpClient,session', null)(withMobileViewport(withIntlAsProp(SettingsSystemDatabaseCleaning)));
