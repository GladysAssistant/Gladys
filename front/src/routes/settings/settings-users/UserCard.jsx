import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';

class SettingsUsers extends Component {
  deleteUser = async () => {
    try {
      await this.setState({ loading: true });
      await this.props.httpClient.delete(`/api/v1/user/${this.props.user.selector}`);
      this.props.removeUserFromList(this.props.index);
    } catch (e) {
      this.setState({ loading: false });
      console.error(e);
    }
  };
  confirmUserDeletion = () => {
    this.setState({
      confirmUserDeletion: true
    });
  };
  cancelDeletion = () => {
    this.setState({
      confirmUserDeletion: false
    });
  };
  render({ user, loggedUser }, { confirmUserDeletion, loading }) {
    return (
      <div class={cx('card dimmer', { active: loading === true })}>
        <div class="loader" />
        <div class="dimmer-content">
          <div class="card-body p-4 text-center dimmer">
            <span class="avatar avatar-xl mb-3 avatar-rounded" style={{ backgroundImage: `url(${user.picture})` }} />
            <h4 class="m-0 mb-1">
              {user.firstname} {user.lastname}
            </h4>
            <div class="mt-3">
              <span class="tag tag-green">{user.role}</span>
            </div>
          </div>
          <div class="card-footer">
            {confirmUserDeletion && (
              <div class="alert alert-warning" role="alert">
                <Text id="usersSettings.deleteUserWarning" />
              </div>
            )}
            <div class="btn-list text-center">
              {!confirmUserDeletion && (
                <Link href={`/dashboard/settings/user/edit/${user.selector}`} class="btn btn-outline-primary btn-sm">
                  <i class="fe fe-edit" />
                  <Text id="usersSettings.editUserButton" />
                </Link>
              )}
              {!confirmUserDeletion && loggedUser.id !== user.id && (
                <button class="btn btn-outline-danger btn-sm" onClick={this.confirmUserDeletion}>
                  <i class="fe fe-trash" />
                  <Text id="usersSettings.deleteUserButton" />
                </button>
              )}
              {confirmUserDeletion && (
                <button class="btn btn-danger btn-sm" onClick={this.deleteUser}>
                  <i class="fe fe-trash" />
                  <Text id="usersSettings.confirmDeleteUserButton" />
                </button>
              )}
              {confirmUserDeletion && (
                <button class="btn btn-secondary btn-sm" onClick={this.cancelDeletion}>
                  <i class="fe fe-x-circle" />
                  <Text id="usersSettings.cancelDeleteUser" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('currentUrl,httpClient', {})(SettingsUsers);
