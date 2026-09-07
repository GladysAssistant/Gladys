import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import config from '../../../config';
import { RequestStatus } from '../../../utils/consts';

// The setting lives on the Gladys Plus user, so it is edited from Gladys Plus
export const GLADYS_PLUS_SETTINGS_URL = 'https://plus.gladysassistant.com/dashboard/settings/gateway';

// Delays offered in the select, in minutes. Gladys Plus accepts anything from 5
// minutes to 7 days: a value set another way is kept in the list, so the select
// never lies about the current setting.
const DELAY_OPTIONS_IN_MINUTES = [10, 30, 60, 120, 360, 720, 1440];

const formatDelay = delayInMinutes =>
  delayInMinutes < 60 ? `${delayInMinutes} min` : `${Math.round((delayInMinutes / 60) * 10) / 10} h`;

// "Is my Gladys alive?": Gladys Plus emails the user when the instance has been
// unreachable for longer than the delay, and again when it is back. The setting
// is per Gladys Plus user (each one receives the emails at his own address), so
// it is read and written on the Gladys Plus user: only the gateway mode has that
// session. In local mode the card explains where to change it.
class GatewayInstanceOfflineAlert extends Component {
  state = {
    status: null,
    saveStatus: null,
    user: null
  };

  getGatewayUser = async () => {
    this.setState({ status: RequestStatus.Getting });
    try {
      const user = await this.props.session.getGatewayUser();
      this.setState({ user, status: RequestStatus.Success });
    } catch (e) {
      console.error(e);
      this.setState({ status: RequestStatus.Error });
    }
  };

  save = async fields => {
    this.setState({ saveStatus: RequestStatus.Getting });
    try {
      const updatedUser = await this.props.session.updateGatewayUser(fields);
      this.setState(({ user }) => ({
        user: Object.assign({}, user, updatedUser),
        saveStatus: RequestStatus.Success
      }));
    } catch (e) {
      console.error(e);
      this.setState({ saveStatus: RequestStatus.Error });
    }
  };

  toggleEnabled = () => {
    this.save({ instance_offline_alert_enabled: !this.state.user.instance_offline_alert_enabled });
  };

  updateDelay = e => {
    this.save({ instance_offline_alert_delay_in_minutes: parseInt(e.target.value, 10) });
  };

  componentDidMount() {
    if (config.gatewayMode) {
      this.getGatewayUser();
    }
  }

  render(props, { status, saveStatus, user }) {
    const currentDelay = user ? user.instance_offline_alert_delay_in_minutes : null;
    const delayOptions =
      currentDelay && !DELAY_OPTIONS_IN_MINUTES.includes(currentDelay)
        ? [...DELAY_OPTIONS_IN_MINUTES, currentDelay].sort((a, b) => a - b)
        : DELAY_OPTIONS_IN_MINUTES;
    const saving = saveStatus === RequestStatus.Getting;
    return (
      <div class="card" data-cy="gateway-instance-offline-alert">
        <div class="card-header">
          <h3 class="card-title">
            <Text id="gateway.instanceOfflineAlertTitle" />
          </h3>
        </div>
        <div class={cx('dimmer', { active: status === RequestStatus.Getting || saving })}>
          <div class="loader" />
          <div class="dimmer-content">
            <div class="card-body">
              <p>
                <Text id="gateway.instanceOfflineAlertDescription" />
              </p>
              {!config.gatewayMode && (
                <div>
                  <p class="text-muted">
                    <Text id="gateway.instanceOfflineAlertLocalModeNotice" />
                  </p>
                  <a href={GLADYS_PLUS_SETTINGS_URL} target="_blank" rel="noopener noreferrer" class="btn btn-primary">
                    <Text id="gateway.instanceOfflineAlertOpenGladysPlus" />
                    <i class="fe fe-external-link ml-1" />
                  </a>
                </div>
              )}
              {config.gatewayMode && status === RequestStatus.Error && (
                <div class="alert alert-danger">
                  <Text id="gateway.instanceOfflineAlertLoadError" />
                </div>
              )}
              {config.gatewayMode && user && (
                <div>
                  <div class="form-group">
                    <label class="custom-switch">
                      <input
                        type="checkbox"
                        class="custom-switch-input"
                        checked={user.instance_offline_alert_enabled}
                        onChange={this.toggleEnabled}
                        disabled={saving}
                        data-cy="gateway-instance-offline-alert-switch"
                      />
                      <span class="custom-switch-indicator" />
                      <span class="custom-switch-description">
                        <Text id="gateway.instanceOfflineAlertEnabledLabel" fields={{ email: user.email }} />
                      </span>
                    </label>
                  </div>
                  {user.instance_offline_alert_enabled && (
                    <div class="form-group">
                      <label class="form-label">
                        <Text id="gateway.instanceOfflineAlertDelayLabel" />
                      </label>
                      <select
                        class="form-control"
                        value={currentDelay}
                        onChange={this.updateDelay}
                        disabled={saving}
                        data-cy="gateway-instance-offline-alert-delay"
                      >
                        {delayOptions.map(delay => (
                          <option value={delay} selected={delay === currentDelay}>
                            {formatDelay(delay)}
                          </option>
                        ))}
                      </select>
                      <small class="form-text text-muted">
                        <Text id="gateway.instanceOfflineAlertDelayHelp" />
                      </small>
                    </div>
                  )}
                  {saveStatus === RequestStatus.Error && (
                    <div class="alert alert-danger">
                      <Text id="gateway.instanceOfflineAlertSaveError" />
                    </div>
                  )}
                  {saveStatus === RequestStatus.Success && (
                    <div class="alert alert-success">
                      <Text id="gateway.instanceOfflineAlertSaved" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default GatewayInstanceOfflineAlert;
