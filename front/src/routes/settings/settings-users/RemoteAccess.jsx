import { Component } from 'preact';
import { Text, MarkupText, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../utils/consts';
import { REMOTE_STATUS, ACTION_NEEDED_STATUSES } from './buildUsersView';
import style from './style.css';

// the Users page of the Gladys Plus app: where invitations are sent when this
// page is opened locally (the browser has no Plus token there)
export const GLADYS_PLUS_USERS_URL = 'https://plus.gladysassistant.com/dashboard/settings/user';

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

  render(props, { confirmRevoke, revoking, inviteOpen, inviteEmail, inviteRole, inviteStatus }) {
    const { remote, user, gatewayMode, isAdmin, isPlusAdmin, plusMe, language } = props;
    const status = remote ? remote.status : REMOTE_STATUS.NONE;
    const keysLoaded = props.gatewayKeysStatus === RequestStatus.Success;
    // without the keys of the instance, "no remote access" would be a guess
    const unknown = !remote && !keysLoaded;
    const ui = STATUS_UI[status];
    const actionNeeded = ACTION_NEEDED_STATUSES.includes(status);
    const canSwitch = Boolean(remote && remote.keys && isAdmin);
    const canInvite = status === REMOTE_STATUS.NONE && gatewayMode && isPlusAdmin && user;
    const isMe = Boolean(remote && plusMe && remote.id === plusMe.id);
    const canRevoke = Boolean(remote && remote.account && gatewayMode && isPlusAdmin && !isMe);
    const account = remote && remote.account;
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
            {(plusEmail || account) && !unknown && (
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
            {canInvite && !inviteOpen && (
              <button type="button" class="btn btn-primary btn-sm" onClick={this.openInvite}>
                <i class="fe fe-send" /> <Text id="usersSettings.plus.inviteThisUser" />
              </button>
            )}
            {status === REMOTE_STATUS.NONE && !gatewayMode && keysLoaded && (
              <a
                href={GLADYS_PLUS_USERS_URL}
                target="_blank"
                rel="noopener noreferrer"
                class={cx('btn btn-outline-primary btn-sm', style.inviteFromPlus)}
              >
                <i class="fe fe-external-link" /> <Text id="usersSettings.plus.inviteFromPlus" />
              </a>
            )}
            {canRevoke && !confirmRevoke && (
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
