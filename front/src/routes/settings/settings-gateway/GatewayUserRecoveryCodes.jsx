import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';
import { RequestStatus } from '../../../utils/consts';
import GatewayRecoveryCodes from '../../../components/gateway/GatewayRecoveryCodes';

// Two-factor recovery codes of a Gladys Plus user, generated from this instance.
// A user who lost both their two-factor app and their recovery codes is locked out of
// Gladys Plus: the instance (authenticated by its own keys, and physically at home)
// stands in for the second factor and asks Gladys Plus for a new set of codes. Admin
// only, and the admin re-enters their local password: a session left open on a wall
// tablet must not be enough. The previous codes stop working and the user is emailed.
class GatewayUserRecoveryCodes extends Component {
  state = {
    gatewayUserId: null,
    password: '',
    status: null,
    error: null,
    recoveryCodes: null
  };

  getUsers = props => props.gatewayUsersKeys || [];

  // the Gladys Plus user linked to the admin making the request is the usual case
  getDefaultGatewayUserId = props => {
    const users = this.getUsers(props);
    const me = users.find(user => user.gladys_4_user_id && user.gladys_4_user_id === get(props, 'user.id'));
    const defaultUser = me || users[0];
    return defaultUser ? defaultUser.id : null;
  };

  getSelectedGatewayUserId = () => {
    const users = this.getUsers(this.props);
    const { gatewayUserId } = this.state;
    if (gatewayUserId && users.some(user => user.id === gatewayUserId)) {
      return gatewayUserId;
    }
    return this.getDefaultGatewayUserId(this.props);
  };

  updateGatewayUserId = e => {
    this.setState({ gatewayUserId: e.target.value, error: null });
  };

  updatePassword = e => {
    this.setState({ password: e.target.value, error: null });
  };

  generateRecoveryCodes = async e => {
    e.preventDefault();
    const gatewayUserId = this.getSelectedGatewayUserId();
    if (!gatewayUserId || !this.state.password) {
      return;
    }
    this.setState({ status: RequestStatus.Getting, error: null });
    try {
      const { recovery_codes: recoveryCodes } = await this.props.httpClient.post(
        `/api/v1/gateway/user/${encodeURIComponent(gatewayUserId)}/recovery-codes`,
        {
          password: this.state.password
        }
      );
      this.setState({ recoveryCodes, password: '', status: RequestStatus.Success });
    } catch (err) {
      console.error(err);
      const status = get(err, 'response.status');
      const message = get(err, 'response.data.message');
      let error = 'unknown';
      if (message === 'WRONG_PASSWORD') {
        error = 'wrongPassword';
      } else if (message === 'GATEWAY_TWO_FACTOR_NOT_ENABLED') {
        error = 'twoFactorNotEnabled';
      } else if (status === 404) {
        error = 'userNotFound';
      } else if (message === 'NO_CONNECTED_TO_THE_INTERNET') {
        error = 'network';
      }
      this.setState({ status: RequestStatus.Error, error, password: '' });
    }
  };

  // the codes were displayed once: back to the form, nothing is kept
  closeRecoveryCodes = () => {
    this.setState({ recoveryCodes: null, status: null, error: null });
  };

  render(props, { password, status, error, recoveryCodes }) {
    if (recoveryCodes) {
      return (
        <GatewayRecoveryCodes
          recoveryCodes={recoveryCodes}
          status={status}
          onContinue={this.closeRecoveryCodes}
          continueLabelId="gateway.recoveryCodesDoneButton"
        />
      );
    }
    const users = this.getUsers(props);
    const selectedGatewayUserId = this.getSelectedGatewayUserId();
    const myId = get(props, 'user.id');
    return (
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <Text id="gateway.recoveryCodesTitle" />
          </h3>
        </div>
        <div class={cx('dimmer', { active: status === RequestStatus.Getting })}>
          <div class="loader" />
          <div class="dimmer-content">
            <div class="card-body">
              <p>
                <Text id="gateway.recoveryCodesDescription" />
              </p>
              <div class="alert alert-warning" role="alert">
                <Text id="gateway.recoveryCodesWarning" />
              </div>
              {error && (
                <div class="alert alert-danger" role="alert">
                  {error === 'wrongPassword' && <Text id="gateway.recoveryCodesWrongPassword" />}
                  {error === 'twoFactorNotEnabled' && <Text id="gateway.recoveryCodesTwoFactorNotEnabled" />}
                  {error === 'userNotFound' && <Text id="gateway.recoveryCodesUserNotFound" />}
                  {error === 'network' && <Text id="gateway.yourGatewayIsNotConnected" />}
                  {error === 'unknown' && <Text id="gateway.recoveryCodesError" />}
                </div>
              )}
              {users.length === 0 ? (
                <p class="text-muted mb-0">
                  <Text id="gateway.recoveryCodesNoUser" />
                </p>
              ) : (
                <form onSubmit={this.generateRecoveryCodes}>
                  <div class="form-group">
                    <label class="form-label" for="gateway-recovery-codes-user">
                      <Text id="gateway.recoveryCodesUserLabel" />
                    </label>
                    <select
                      id="gateway-recovery-codes-user"
                      class="form-control custom-select"
                      value={selectedGatewayUserId}
                      onChange={this.updateGatewayUserId}
                    >
                      {users.map(user => (
                        <option value={user.id} selected={user.id === selectedGatewayUserId}>
                          {user.name}
                          {user.gladys_4_user_id && user.gladys_4_user_id === myId && (
                            <Text id="gateway.recoveryCodesLinkedToYou" />
                          )}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="gateway-recovery-codes-password">
                      <Text id="gateway.recoveryCodesPasswordLabel" />
                    </label>
                    <Localizer>
                      <input
                        id="gateway-recovery-codes-password"
                        type="password"
                        class="form-control"
                        autoComplete="current-password"
                        placeholder={<Text id="gateway.recoveryCodesPasswordPlaceholder" />}
                        value={password}
                        onInput={this.updatePassword}
                      />
                    </Localizer>
                    <small class="form-text text-muted">
                      <Text id="gateway.recoveryCodesPasswordHelp" />
                    </small>
                  </div>
                  <div class="form-footer">
                    <button
                      type="submit"
                      class="btn btn-primary"
                      disabled={!selectedGatewayUserId || !password || status === RequestStatus.Getting}
                    >
                      <Text id="gateway.recoveryCodesGenerateButton" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default GatewayUserRecoveryCodes;
