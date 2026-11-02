import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';

import RemoteAccess from './RemoteAccess';
import style from './style.css';

const initials = user => `${(user.firstname || '').charAt(0)}${(user.lastname || '').charAt(0)}`.toUpperCase() || '?';

const Avatar = ({ user }) => {
  if (user.picture) {
    return <span class={style.avatar} style={{ backgroundImage: `url(${user.picture})` }} />;
  }
  return <span class={cx(style.avatar, style.avatarInitials)}>{initials(user)}</span>;
};

// One Gladys user: who they are, what the admin can do with their account,
// and (when Gladys Plus is configured) the state of their remote access.
class UserCard extends Component {
  confirmDeletion = () => {
    this.setState({ confirmDeletion: true, deleteError: false });
  };

  cancelDeletion = () => {
    this.setState({ confirmDeletion: false });
  };

  deleteUser = async () => {
    this.setState({ deleting: true });
    await this.props.deleteUser(this.props.user, () => {
      this.setState({ deleting: false, deleteError: true });
    });
  };

  render({ user, remote, loggedUser, remoteProps }, { confirmDeletion, deleting, deleteError }) {
    const isMe = loggedUser && loggedUser.id === user.id;
    const isAdmin = remoteProps.isAdmin;
    return (
      <div class={cx('card', style.userCard, { dimmer: deleting, active: deleting })}>
        <div class="loader" />
        <div class="dimmer-content">
          <div class={style.userHeader}>
            <Avatar user={user} />
            <div class={style.userHeading}>
              <span class={style.userName}>
                {user.firstname} {user.lastname}
                {isMe && (
                  <span class={style.youTag}>
                    <Text id="usersSettings.you" />
                  </span>
                )}
              </span>
              <span class={style.userMeta}>
                {user.email}
                <span class={cx('tag', style.roleTag, { 'tag-green': user.role === 'admin' })}>
                  <Text id={`usersSettings.roles.${user.role}`}>{user.role}</Text>
                </span>
              </span>
            </div>
            {isAdmin && !confirmDeletion && (
              <div class={style.userActions}>
                <Link href={`/dashboard/settings/user/edit/${user.selector}`} class="btn btn-outline-primary btn-sm">
                  <i class="fe fe-edit" />
                  <span class={style.actionLabel}>
                    <Text id="usersSettings.editUserButton" />
                  </span>
                </Link>
                {!isMe && (
                  <button type="button" class="btn btn-outline-danger btn-sm" onClick={this.confirmDeletion}>
                    <i class="fe fe-trash" />
                    <span class={style.actionLabel}>
                      <Text id="usersSettings.deleteUserButton" />
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
          {confirmDeletion && (
            <div class={style.confirmBox}>
              <div class="alert alert-warning mb-2" role="alert">
                <Text id="usersSettings.deleteUserWarning" />
              </div>
              {deleteError && (
                <div class="alert alert-danger mb-2" role="alert">
                  <Text id="usersSettings.deleteUserError" />
                </div>
              )}
              <div class="btn-list">
                <button type="button" class="btn btn-danger btn-sm" onClick={this.deleteUser}>
                  <i class="fe fe-trash" /> <Text id="usersSettings.confirmDeleteUserButton" />
                </button>
                <button type="button" class="btn btn-secondary btn-sm" onClick={this.cancelDeletion}>
                  <Text id="usersSettings.cancelDeleteUser" />
                </button>
              </div>
            </div>
          )}
          {remoteProps.plusConfigured && <RemoteAccess remote={remote} user={user} {...remoteProps} />}
        </div>
      </div>
    );
  }
}

export default UserCard;
