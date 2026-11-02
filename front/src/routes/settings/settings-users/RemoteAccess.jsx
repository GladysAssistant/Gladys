import { Component } from 'preact';
import { Text, MarkupText, Localizer } from 'preact-i18n';
import get from 'get-value';
import cx from 'classnames';

import { RequestStatus } from '../../../utils/consts';
import { REMOTE_STATUS, ACTION_NEEDED_STATUSES } from './buildUsersView';
import style from './style.css';

// Where invitations are sent when this page is opened locally (the browser has
// no Plus token there): the Plus users page of the Gladys Plus app. Its old
// route, which redirects to the Users page once this version is deployed
// there, and still serves the invite form until then.
export const GLADYS_PLUS_USERS_URL = 'https://plus.gladysassistant.com/dashboard/settings/gateway-users';

const STATUS_UI = {
  [REMOTE_STATUS.AUTHORIZED]: { badge: 'badge-success', icon: 'check-circle', tone: style.toneSuccess },
  [REMOTE_STATUS.PENDING]: { badge: 'badge-warning', icon: 'clock', tone: style.toneWarning },
  [REMOTE_STATUS.KEYS_CHANGED]: { badge: 'badge-danger', icon: 'alert-triangle', tone: style.toneDanger },
  [REMOTE_STATUS.NOT_LINKED]: { badge: 'badge-info', icon: 'link', tone: style.toneInfo },
  [REMOTE_STATUS.INVITED]: { badge: 'badge-info', icon: 'mail', tone: style.toneInfo },
  [REMOTE_STATUS.NONE]: { badge: 'badge-secondary', icon: 'globe', tone: style.toneMuted }
};

const DATE_OPTIONS = { year: 'numeric', month: 'long', day: 'numeric' };

const formatDate = (date, language) => {
  if (!date) {
    return null;
  }
  try {
    return new Date(date).toLocaleDateString(language || undefined, DATE_OPTIONS);
  } catch (e) {
    return new Date(date).toLocaleDateString();
  }
};

// The key fingerprints are what the admin compares with the ones the user sees
// on their Gladys Plus page: that comparison, done at home, is the whole point
// of the authorization. Open by default while an authorization is expected,
// folded once the user is authorized.
const Fingerprints = ({ keys, open }) => (
  <details class={style.fingerprints} open={open}>
    <summary class={style.fingerprintsSummary}>
      <i class="fe fe-key" />
      <Text id="usersSettings.plus.fingerprintsSummary" />
    </summary>
    <p class={style.fingerprintsHint}>
      <Text id="usersSettings.plus.fingerprintsHint" />
    </p>
    <dl class={style.fingerprintList}>
      <dt>
        <Text id="usersSettings.plus.rsaKey" />
      </dt>
      <dd>
        <code>{keys.rsa_public_key}</code>
      </dd>
      <dt>
        <Text id="usersSettings.plus.ecdsaKey" />
      </dt>
      <dd>
        <code>{keys.ecdsa_public_key}</code>
      </dd>
    </dl>
  </details>
);

// The Gladys Plus side of a user: their status (invited, account created,
// waiting for authorization, authorized…), the switch that authorizes their
// keys on the instance, and the Plus account actions (invite, remove).
class RemoteAccess extends Component {
  askRevoke = () => {
    this.setState({ confirmRevoke: true });
  };

  cancelRevoke = () => {
    this.setState({ confirmRevoke: false });
  };

  revoke = async () => {
    this.setState({ revoking: true });
    await this.props.revokeRemote(this.props.remote);
    this.setState({ revoking: false, confirmRevoke: false });
  };

  switchKey = () => {
    const { remote } = this.props;
    this.props.switchUserKey(remote.keysIndex, !remote.keys.accepted);
  };

  // the invite form opens in the strip with the user's own email prefilled
  openInvite = () => {
    this.setState({
      inviteOpen: true,
      inviteEmail: this.props.user.email || '',
      inviteRole: 'user',
      inviteStatus: null
    });
  };

  closeInvite = () => {
    this.setState({ inviteOpen: false, inviteStatus: null });
  };

  updateInviteEmail = e => {
    this.setState({ inviteEmail: e.target.value, inviteStatus: null });
  };

  updateInviteRole = e => {
    this.setState({ inviteRole: e.target.value });
  };

  invite = async e => {
    if (e) {
      e.preventDefault();
    }
    this.setState({ inviteStatus: RequestStatus.Getting });
    try {
      await this.props.inviteUser({
        user: this.props.user,
        email: this.state.inviteEmail,
        role: this.state.inviteRole
      });
      // the card now shows the invitation: the form has done its job
      this.setState({ inviteOpen: false, inviteStatus: null });
    } catch (err) {
      const status = err && err.message === RequestStatus.ValidationError ? err.message : RequestStatus.Error;
      if (status === RequestStatus.Error) {
        console.error(err);
      }
      this.setState({ inviteStatus: status });
    }
  };

  askResetTwoFactor = () => {
    this.setState({ resetTwoFactorOpen: true, resetTwoFactorCode: '', resetTwoFactorStatus: null });
  };

  cancelResetTwoFactor = () => {
    this.setState({ resetTwoFactorOpen: false, resetTwoFactorStatus: null });
  };

  updateResetTwoFactorCode = e => {
    this.setState({ resetTwoFactorCode: e.target.value, resetTwoFactorStatus: null });
  };

  resetTwoFactor = async e => {
    if (e) {
      e.preventDefault();
    }
    this.setState({ resetTwoFactorStatus: RequestStatus.Getting });
    try {
      await this.props.resetRemoteTwoFactor(this.props.remote, this.state.resetTwoFactorCode);
      this.setState({ resetTwoFactorOpen: false, resetTwoFactorStatus: RequestStatus.Success });
    } catch (err) {
      console.error(err);
      const httpStatus = get(err, 'response.status');
      let status = RequestStatus.Error;
      if (httpStatus === 403) {
        status = RequestStatus.ValidationError;
      } else if (httpStatus === 429) {
        status = RequestStatus.RateLimitError;
      }
      this.setState({ resetTwoFactorStatus: status });
    }
  };

  selectLinkUser = e => {
    this.setState({ linkUserId: e.target.value, linkStatus: null });
  };

  // link the Plus account (or invitation) to the Gladys user picked in the select,
  // or, on a user's card where it was recognized by its email, to that user
  link = async gladysUserId => {
    if (!gladysUserId) {
      return;
    }
    this.setState({ linkStatus: RequestStatus.Getting });
    try {
      await this.props.linkRemote(this.props.remote, gladysUserId);
      this.setState({ linkStatus: RequestStatus.Success, linkUserId: '' });
    } catch (err) {
      console.error(err);
      this.setState({ linkStatus: RequestStatus.Error });
    }
  };

  linkToSelectedUser = e => {
    if (e) {
      e.preventDefault();
    }
    this.link(this.state.linkUserId);
  };

  linkToThisUser = () => {
    this.link(this.props.user.id);
  };

  render(
    props,
    {
      confirmRevoke,
      revoking,
      inviteOpen,
      inviteEmail,
      inviteRole,
      inviteStatus,
      linkUserId,
      linkStatus,
      resetTwoFactorOpen,
      resetTwoFactorCode,
      resetTwoFactorStatus
    }
  ) {
    const { remote, user, gatewayMode, isAdmin, isPlusAdmin, plusMe, language } = props;
    const status = remote ? remote.status : REMOTE_STATUS.NONE;
    // Without the keys of the instance, "no remote access" or "not linked" would
    // be a guess: only when they could not be loaded (the page waits for them
    // while they load; a Plus admin who is not a local admin never loads them
    // and reads the Plus account instead)
    const keysFailed =
      props.gatewayKeysStatus === RequestStatus.Error || props.gatewayKeysStatus === RequestStatus.NetworkError;
    const unknown = keysFailed && (!remote || (!remote.keys && !remote.isInvitation));
    const ui = STATUS_UI[status];
    const actionNeeded = ACTION_NEEDED_STATUSES.includes(status);
    const canSwitch = Boolean(remote && remote.keys && isAdmin);
    const canInvite = status === REMOTE_STATUS.NONE && gatewayMode && isPlusAdmin && user;
    const isMe = Boolean(remote && plusMe && remote.id === plusMe.id);
    const canRevoke = Boolean(remote && remote.account && gatewayMode && isPlusAdmin && !isMe);
    // a Plus admin can reset the second factor of another user of the account who
    // lost their authenticator (confirming with their own code); never their own
    const canResetTwoFactor = Boolean(
      remote &&
        remote.account &&
        !remote.isInvitation &&
        gatewayMode &&
        isPlusAdmin &&
        !isMe &&
        props.resetRemoteTwoFactor
    );
    const resettingTwoFactor = resetTwoFactorStatus === RequestStatus.Getting;
    const account = remote && remote.account;
    // a Plus admin can attach a Plus account or a pending invitation to a Gladys user:
    // in one click on the card it was recognized on (by email), or through a select
    // when it hangs under "not linked"
    const canLink = Boolean(
      remote && remote.account && !remote.linked && gatewayMode && isPlusAdmin && props.linkRemote
    );
    const linking = linkStatus === RequestStatus.Getting;
    const linkableUsers =
      canLink && !user ? props.users.filter(candidate => !props.takenUserIds.includes(candidate.id)) : [];
    const invitedOn = status === REMOTE_STATUS.INVITED && account ? formatDate(account.created_at, language) : null;
    const memberSince = status !== REMOTE_STATUS.INVITED && account ? formatDate(account.created_at, language) : null;
    // the Plus email is worth a line when it is not simply the user's own (an
    // unattached account already shows it in its header)
    const plusEmail = Boolean(remote && remote.email && user && remote.email !== (user.email || '').toLowerCase());

    return (
      <div class={cx(style.remote, ui.tone, { [style.remoteActionNeeded]: actionNeeded })}>
        <div class={style.remoteRow}>
          <span class={style.remoteIcon}>
            <i class={`fe fe-${ui.icon}`} />
          </span>
          <div class={style.remoteBody}>
            <div class={style.remoteTitleRow}>
              <span class={style.remoteLabel}>
                <Text id="usersSettings.plus.sectionLabel" />
              </span>
              {!unknown && (
                <span class={cx('badge', ui.badge)}>
                  <Text id={`usersSettings.plus.status.${status}`} />
                </span>
              )}
            </div>
            <p class={style.remoteText}>
              {unknown ? (
                <Text id="usersSettings.plus.statusUnavailable" />
              ) : (
                <Text id={`usersSettings.plus.statusText.${status}`} fields={{ date: invitedOn }} />
              )}
            </p>
            {(plusEmail || account || (remote && remote.keys && remote.keys.connected)) && !unknown && (
              <div class={style.remoteMeta}>
                {plusEmail && <span>{remote.email}</span>}
                {account && account.role && (
                  <span>
                    <Text id={`usersSettings.plus.plusRole.${account.role}`}>{account.role}</Text>
                  </span>
                )}
                {memberSince && (
                  <span>
                    <Text id="usersSettings.plus.memberSince" fields={{ date: memberSince }} />
                  </span>
                )}
                {remote.keys && remote.keys.connected && (
                  <span class={style.online}>
                    <Text id="usersSettings.plus.online" />
                  </span>
                )}
              </div>
            )}
          </div>
          <div class={style.remoteControls}>
            {canSwitch && (
              <label class={cx('custom-switch', style.switch)}>
                <input
                  type="checkbox"
                  class="custom-switch-input"
                  checked={remote.keys.accepted}
                  onChange={this.switchKey}
                  disabled={props.switchStatus === RequestStatus.Getting}
                />
                <span class="custom-switch-indicator" />
                <span class={cx('custom-switch-description', style.switchLabel)}>
                  <Text id="usersSettings.plus.authorizeSwitchLabel" />
                </span>
              </label>
            )}
            {canLink && user && (
              <button
                type="button"
                class={cx('btn btn-primary btn-sm', { 'btn-loading': linking })}
                disabled={linking}
                onClick={this.linkToThisUser}
              >
                <i class="fe fe-link" />{' '}
                <Text id="usersSettings.plus.link.toThisUser" fields={{ name: user.firstname }} />
              </button>
            )}
            {canInvite && !inviteOpen && (
              <button type="button" class="btn btn-primary btn-sm" onClick={this.openInvite}>
                <i class="fe fe-send" /> <Text id="usersSettings.plus.inviteThisUser" />
              </button>
            )}
            {status === REMOTE_STATUS.NONE && !gatewayMode && !unknown && (
              <a
                href={GLADYS_PLUS_USERS_URL}
                target="_blank"
                rel="noopener noreferrer"
                class={cx('btn btn-outline-primary btn-sm', style.inviteFromPlus)}
              >
                <i class="fe fe-external-link" /> <Text id="usersSettings.plus.inviteFromPlus" />
              </a>
            )}
            {canResetTwoFactor && !resetTwoFactorOpen && !confirmRevoke && (
              <button type="button" class={cx('btn btn-sm', style.quietAction)} onClick={this.askResetTwoFactor}>
                <i class="fe fe-shield-off" /> <Text id="usersSettings.plus.twoFactor.button" />
              </button>
            )}
            {canRevoke && !confirmRevoke && !resetTwoFactorOpen && (
              <button type="button" class={cx('btn btn-sm', style.quietDanger)} onClick={this.askRevoke}>
                <i class="fe fe-user-x" />{' '}
                <Text
                  id={
                    status === REMOTE_STATUS.INVITED
                      ? 'usersSettings.plus.cancelInvitationButton'
                      : 'usersSettings.plus.revokeButton'
                  }
                />
              </button>
            )}
          </div>
        </div>
        {canLink && !user && (
          <form class={style.linkForm} onSubmit={this.linkToSelectedUser}>
            <label class="form-label" for={`link-user-${remote.id}`}>
              <Text id="usersSettings.plus.link.selectLabel" />
            </label>
            <div class={style.linkFields}>
              <select
                id={`link-user-${remote.id}`}
                class="form-control custom-select"
                value={linkUserId || ''}
                onChange={this.selectLinkUser}
                disabled={linking}
              >
                <option value="">
                  <Text id="usersSettings.plus.link.selectPlaceholder" />
                </option>
                {linkableUsers.map(candidate => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.firstname} {candidate.lastname}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                class={cx('btn btn-primary btn-sm', { 'btn-loading': linking })}
                disabled={linking || !linkUserId}
              >
                <i class="fe fe-link" /> <Text id="usersSettings.plus.link.button" />
              </button>
            </div>
            <p class={style.inviteHelp}>
              <Text id="usersSettings.plus.link.help" />
            </p>
          </form>
        )}
        {linkStatus === RequestStatus.Error && (
          <div class={cx('alert alert-danger mb-0', style.remoteAlert)} role="alert">
            <Text id="usersSettings.plus.link.error" />
          </div>
        )}
        {canInvite && inviteOpen && (
          <form class={style.inviteForm} onSubmit={this.invite}>
            <p class={style.inviteDescription}>
              <Text id="usersSettings.plus.invite.description" fields={{ name: user.firstname }} />
            </p>
            <div class={style.inviteFields}>
              <div class={style.inviteEmail}>
                <label class="form-label" for={`invite-email-${user.id}`}>
                  <Text id="usersSettings.plus.invite.emailLabel" />
                </label>
                <Localizer>
                  <input
                    id={`invite-email-${user.id}`}
                    type="email"
                    class={cx('form-control', { 'is-invalid': inviteStatus === RequestStatus.ValidationError })}
                    placeholder={<Text id="usersSettings.plus.invite.emailPlaceholder" />}
                    value={inviteEmail}
                    onInput={this.updateInviteEmail}
                    required
                  />
                </Localizer>
                {inviteStatus === RequestStatus.ValidationError && (
                  <div class="invalid-feedback d-block">
                    <Text id="usersSettings.plus.invite.invalidEmail" />
                  </div>
                )}
              </div>
              <div class={style.inviteRole}>
                <label class="form-label" for={`invite-role-${user.id}`}>
                  <Text id="usersSettings.plus.invite.roleLabel" />
                </label>
                <select
                  id={`invite-role-${user.id}`}
                  class="form-control custom-select"
                  value={inviteRole}
                  onChange={this.updateInviteRole}
                >
                  <option value="user">
                    <Text id="usersSettings.plus.plusRole.user" />
                  </option>
                  <option value="admin">
                    <Text id="usersSettings.plus.plusRole.admin" />
                  </option>
                </select>
              </div>
              <div class={style.inviteActions}>
                <button
                  type="submit"
                  class={cx('btn btn-primary btn-sm', { 'btn-loading': inviteStatus === RequestStatus.Getting })}
                  disabled={inviteStatus === RequestStatus.Getting}
                >
                  <i class="fe fe-send" /> <Text id="usersSettings.plus.invite.button" />
                </button>
                <button type="button" class="btn btn-secondary btn-sm" onClick={this.closeInvite}>
                  <Text id="usersSettings.plus.cancel" />
                </button>
              </div>
            </div>
            <p class={style.inviteHelp}>
              <Text id="usersSettings.plus.invite.roleHelp" />
            </p>
            {inviteStatus === RequestStatus.Error && (
              <div class="alert alert-danger mb-0" role="alert">
                <Text id="usersSettings.plus.invite.error" />
              </div>
            )}
          </form>
        )}
        {canResetTwoFactor && resetTwoFactorOpen && (
          <form class={style.confirmBox} onSubmit={this.resetTwoFactor}>
            <div class="alert alert-warning mb-2" role="alert">
              <Text id="usersSettings.plus.twoFactor.confirmText" fields={{ name: remote.name || remote.email }} />
            </div>
            <div class={style.twoFactorFields}>
              <label class="form-label" for={`reset-two-factor-${remote.id}`}>
                <Text id="usersSettings.plus.twoFactor.codeLabel" />
              </label>
              <div class={style.twoFactorRow}>
                <Localizer>
                  <input
                    id={`reset-two-factor-${remote.id}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    class={cx('form-control', style.twoFactorInput, {
                      'is-invalid': resetTwoFactorStatus === RequestStatus.ValidationError
                    })}
                    placeholder={<Text id="usersSettings.plus.twoFactor.codePlaceholder" />}
                    value={resetTwoFactorCode}
                    onInput={this.updateResetTwoFactorCode}
                    maxLength={6}
                    required
                  />
                </Localizer>
                <button
                  type="submit"
                  class={cx('btn btn-danger btn-sm', { 'btn-loading': resettingTwoFactor })}
                  disabled={resettingTwoFactor || !resetTwoFactorCode}
                >
                  <i class="fe fe-shield-off" /> <Text id="usersSettings.plus.twoFactor.confirmButton" />
                </button>
                <button type="button" class="btn btn-secondary btn-sm" onClick={this.cancelResetTwoFactor}>
                  <Text id="usersSettings.plus.cancel" />
                </button>
              </div>
            </div>
            {resetTwoFactorStatus === RequestStatus.ValidationError && (
              <div class="alert alert-danger mt-2 mb-0" role="alert">
                <Text id="usersSettings.plus.twoFactor.errorWrongCode" />
              </div>
            )}
            {resetTwoFactorStatus === RequestStatus.RateLimitError && (
              <div class="alert alert-danger mt-2 mb-0" role="alert">
                <Text id="usersSettings.plus.twoFactor.errorTooManyAttempts" />
              </div>
            )}
            {resetTwoFactorStatus === RequestStatus.Error && (
              <div class="alert alert-danger mt-2 mb-0" role="alert">
                <Text id="usersSettings.plus.twoFactor.error" />
              </div>
            )}
          </form>
        )}
        {resetTwoFactorStatus === RequestStatus.Success && !resetTwoFactorOpen && (
          <div class={cx('alert alert-success mb-0', style.remoteAlert)} role="status">
            <Text id="usersSettings.plus.twoFactor.success" />
          </div>
        )}
        {confirmRevoke && (
          <div class={style.confirmBox}>
            <div class="alert alert-warning mb-2" role="alert">
              <Text
                id={
                  status === REMOTE_STATUS.INVITED
                    ? 'usersSettings.plus.confirmCancelInvitationText'
                    : 'usersSettings.plus.confirmRevokeText'
                }
              />
            </div>
            <div class="btn-list">
              <button
                type="button"
                class={cx('btn btn-danger btn-sm', { 'btn-loading': revoking })}
                disabled={revoking}
                onClick={this.revoke}
              >
                <i class="fe fe-user-x" /> <Text id="usersSettings.plus.confirmRevokeButton" />
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onClick={this.cancelRevoke}>
                <Text id="usersSettings.plus.cancel" />
              </button>
            </div>
          </div>
        )}
        {status === REMOTE_STATUS.KEYS_CHANGED && (
          <div class={style.remoteNote}>
            <MarkupText id="usersSettings.plus.keysChangedNote" />
          </div>
        )}
        {remote && remote.keys && <Fingerprints keys={remote.keys} open={actionNeeded} />}
      </div>
    );
  }
}

export default RemoteAccess;
