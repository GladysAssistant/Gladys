import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../utils/consts';
import style from './style.css';

// Invite someone to the Gladys Plus account (Plus admins, from the Gladys Plus
// app). The invitation then shows up on the card of the Gladys user with the
// same email, or under "not linked" until they pick their Gladys user.
const InvitePlusUser = ({ email, role, status, updateEmail, updateRole, invite }) => (
  <form id="invite-plus-user" class={cx('card', style.inviteCard)} onSubmit={invite}>
    <div class={style.inviteHeader}>
      <span class={style.inviteIcon}>
        <i class="fe fe-send" />
      </span>
      <div>
        <h3 class={style.inviteTitle}>
          <Text id="usersSettings.plus.invite.title" />
        </h3>
        <p class={style.inviteDescription}>
          <Text id="usersSettings.plus.invite.description" />
        </p>
      </div>
    </div>
    <div class={style.inviteForm}>
      <div class={style.inviteEmail}>
        <label class="form-label" for="invite-plus-user-email">
          <Text id="usersSettings.plus.invite.emailLabel" />
        </label>
        <Localizer>
          <input
            id="invite-plus-user-email"
            type="email"
            class={cx('form-control', { 'is-invalid': status === RequestStatus.ValidationError })}
            placeholder={<Text id="usersSettings.plus.invite.emailPlaceholder" />}
            value={email}
            onInput={updateEmail}
            required
          />
        </Localizer>
        {status === RequestStatus.ValidationError && (
          <div class="invalid-feedback d-block">
            <Text id="usersSettings.plus.invite.invalidEmail" />
          </div>
        )}
      </div>
      <div class={style.inviteRole}>
        <label class="form-label" for="invite-plus-user-role">
          <Text id="usersSettings.plus.invite.roleLabel" />
        </label>
        <select id="invite-plus-user-role" class="form-control custom-select" value={role} onChange={updateRole}>
          <option value="user">
            <Text id="usersSettings.plus.plusRole.user" />
          </option>
          <option value="admin">
            <Text id="usersSettings.plus.plusRole.admin" />
          </option>
        </select>
      </div>
      <div class={style.inviteSubmit}>
        <button
          type="submit"
          class={cx('btn btn-primary', { 'btn-loading': status === RequestStatus.Getting })}
          disabled={status === RequestStatus.Getting}
        >
          <i class="fe fe-send" /> <Text id="usersSettings.plus.invite.button" />
        </button>
      </div>
    </div>
    <p class={style.inviteHelp}>
      <Text id="usersSettings.plus.invite.roleHelp" />
    </p>
    {status === RequestStatus.Success && (
      <div class="alert alert-success mb-0" role="status">
        <Text id="usersSettings.plus.invite.success" />
      </div>
    )}
    {status === RequestStatus.Error && (
      <div class="alert alert-danger mb-0" role="alert">
        <Text id="usersSettings.plus.invite.error" />
      </div>
    )}
  </form>
);

export default InvitePlusUser;
