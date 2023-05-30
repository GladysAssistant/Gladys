import { Component } from 'preact';
import { connect } from 'unistore/preact';
import UserList from './UserList';
import SettingsLayout from '../SettingsLayout';
import linkState from 'linkstate';
import update from 'immutability-helper';

class DashboardUsersPage extends Component {
  state = {
    users: [],
    role: 'user'
  };

  getUsers = () => {
    this.props.session.gatewayClient.getUsersInAccount().then(users => {
      this.setState({ users });
    });
  };

  inviteUser = () => {
    this.props.session.gatewayClient.inviteUser(this.state.email, this.state.role).then(invitedUser => {
      let newState = update(this.state, {
        users: { $push: [invitedUser] }
      });

      this.setState(newState);
    });
  };

  revokeUser = async (user, index) => {
    try {
      if (user.is_invitation) {
        await this.props.session.gatewayClient.revokeInvitation(user.id);
      } else {
        await this.props.session.gatewayClient.revokeUser(user.id);
      }

      const newState = update(this.state, {
        users: { $splice: [[index, 1]] },
        revokeUserError: { $set: false }
      });

      this.setState(newState);
    } catch (e) {
      this.setState({ revokeUserError: true });
    }
  };

  componentDidMount() {
    this.getUsers();
  }

  render({}, { users, email, role, revokeUserError }) {
    return (
      <SettingsLayout>
        <UserList
          users={users}
          getUsers={this.getUsers}
          inviteUser={this.inviteUser}
          email={email}
          role={role}
          updateEmail={linkState(this, 'email')}
          updateRole={linkState(this, 'role')}
          revokeUserError={revokeUserError}
          revokeUser={this.revokeUser}
        />
      </SettingsLayout>
    );
  }
}

export default connect('session', {})(DashboardUsersPage);
