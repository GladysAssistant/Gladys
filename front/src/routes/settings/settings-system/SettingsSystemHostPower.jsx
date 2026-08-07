import { connect } from 'unistore/preact';
import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';

class SettingsSystemHostPower extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pendingAction: null, // 'reboot' | 'shutdown' waiting for confirmation
      actionSent: null,
      error: false,
      errorDetail: null,
      submitting: false
    };
    // Synchronous single-flight guard: setState is async, so it cannot by
    // itself prevent a second click from firing a duplicate request.
    this.submitting = false;
  }

  askConfirmation = action => e => {
    e.preventDefault();
    this.setState({ pendingAction: action, error: false, errorDetail: null });
  };

  cancel = e => {
    e.preventDefault();
    this.setState({ pendingAction: null });
  };

  confirm = async e => {
    e.preventDefault();
    // Bail out synchronously if a request is already in flight.
    if (this.submitting) {
      return;
    }
    this.submitting = true;
    const { pendingAction } = this.state;
    const url = pendingAction === 'reboot' ? '/api/v1/system/reboot' : '/api/v1/system/shutdown-host';
    this.setState({ submitting: true });
    try {
      await this.props.httpClient.post(url);
      this.setState({ pendingAction: null, actionSent: pendingAction, error: false, errorDetail: null });
    } catch (err) {
      console.error(err);
      // No HTTP response at all: the connection dropped, which is exactly what
      // happens when the host starts going down as asked. Treat it as sent
      // rather than showing a spurious error.
      if (!(err && err.response)) {
        this.setState({ pendingAction: null, actionSent: pendingAction, error: false, errorDetail: null });
        return;
      }
      // Surface the server-side error message to the user when available.
      const errorDetail =
        (err && err.response && err.response.data && (err.response.data.message || err.response.data.error)) ||
        (err && err.message) ||
        null;
      this.setState({ pendingAction: null, error: true, errorDetail });
    } finally {
      this.submitting = false;
      this.setState({ submitting: false });
    }
  };

  render({ systemInfos }, { pendingAction, actionSent, error, errorDetail, submitting }) {
    // Fail closed and per action: a host may allow reboot but refuse power-off
    // (or the reverse), so each button is gated by its own capability.
    const rebootAvailable = systemInfos && systemInfos.host_power_reboot_available === true;
    const shutdownAvailable = systemInfos && systemInfos.host_power_shutdown_available === true;
    const anyAvailable = rebootAvailable || shutdownAvailable;

    return (
      <div class="card">
        <h4 class="card-header">
          <Text id="systemSettings.hostPowerTitle" />
        </h4>
        <div class="card-body">
          <p>
            <Text id="systemSettings.hostPowerDescription" />
          </p>

          {!anyAvailable && (
            <div class="alert alert-secondary">
              <Text id="systemSettings.hostPowerUnavailable" />
            </div>
          )}

          {error && (
            <div class="alert alert-danger">
              <Text id="systemSettings.hostPowerError" />
              {errorDetail && (
                <div class="mt-1">
                  <small>{errorDetail}</small>
                </div>
              )}
            </div>
          )}

          {actionSent === 'reboot' && (
            <div class="alert alert-info">
              <Text id="systemSettings.hostRebootSent" />
            </div>
          )}
          {actionSent === 'shutdown' && (
            <div class="alert alert-info">
              <Text id="systemSettings.hostShutdownSent" />
            </div>
          )}

          {pendingAction ? (
            <div>
              <div class="alert alert-warning">
                <Text
                  id={
                    pendingAction === 'reboot'
                      ? 'systemSettings.hostRebootConfirm'
                      : 'systemSettings.hostShutdownConfirm'
                  }
                />
              </div>
              <button onClick={this.confirm} disabled={submitting} class="btn btn-primary mr-2">
                <Text id="systemSettings.confirm" />
              </button>
              <button onClick={this.cancel} disabled={submitting} class="btn btn-danger">
                <Text id="systemSettings.cancel" />
              </button>
            </div>
          ) : (
            <Localizer>
              <div>
                <span title={!rebootAvailable ? <Text id="systemSettings.hostPowerUnavailableTooltip" /> : null}>
                  <button
                    onClick={this.askConfirmation('reboot')}
                    disabled={!rebootAvailable}
                    class="btn btn-orange mr-2"
                  >
                    <Text id="systemSettings.hostRebootButton" />
                  </button>
                </span>
                <span title={!shutdownAvailable ? <Text id="systemSettings.hostPowerUnavailableTooltip" /> : null}>
                  <button
                    onClick={this.askConfirmation('shutdown')}
                    disabled={!shutdownAvailable}
                    class="btn btn-danger"
                  >
                    <Text id="systemSettings.hostShutdownButton" />
                  </button>
                </span>
              </div>
            </Localizer>
          )}
        </div>
      </div>
    );
  }
}

export default connect('httpClient', null)(SettingsSystemHostPower);
