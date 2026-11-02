import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';
import update from 'immutability-helper';

import config from '../../../config';
import { RequestStatus } from '../../../utils/consts';
import { ERROR_MESSAGES, USER_ROLE } from '../../../../../server/utils/constants';
import { validateEmail, cleanEmail } from '../../../utils/validator';
import SettingsLayout from '../SettingsLayout';
import UserPage from './UserPage';
import { buildUsersView } from './buildUsersView';

// The single place to manage people: the Gladys users of the instance and, when
// Gladys Plus is configured, their remote access (invitation, Plus account,
// authorization of their encryption keys). Three sources, loaded side by side:
// - GET /api/v1/user: the Gladys users (anyone can read, admins act)
// - GET /api/v1/gateway/key: the Plus users known by the instance with their
//   keys and whether they are authorized (admin route, both local and gateway
//   mode: the instance holds that list)
// - gatewayClient.getUsersInAccount(): the users and invitations of the Plus
//   account (gateway mode only: the browser holds the Plus token; inviting and
//   revoking are Plus admin operations)
class SettingsUsers extends Component {
  state = {
    users: null,
    loading: true,
    orderDir: 'asc',
    search: '',
    gatewayStatus: null,
    gatewayKeys: null,
    gatewayKeysStatus: null,
    plusUsers: null,
    plusUsersStatus: null,
    plusMe: null,
    revokeError: false,
    switchStatus: null
  };

  isAdmin = () => get(this.props, 'user.role') === USER_ROLE.ADMIN;

  // the role in the Gladys Plus account, not on the instance: inviting and
  // revoking Plus users are Plus admin operations (the store flag is read at
  // login, the profile answers it for the session too)
  isPlusAdmin = () =>
    config.gatewayMode && (this.props.gatewayUserRole === 'admin' || get(this.state, 'plusMe.role') === 'admin');

  getUsers = async () => {
    try {
      const users = await this.props.httpClient.get('/api/v1/user', {
        fields: 'id,firstname,lastname,selector,role,picture,email',
        order_dir: 'asc'
      });
      this.setState({ users, loading: false });
    } catch (e) {
      console.error(e);
      this.setState({ loading: false });
    }
  };

  getGateway = async () => {
    // the Gladys Plus status and the keys are admin routes; the logged user
    // can still be loading when the page mounts (componentDidUpdate retries)
    if (!this.isAdmin() || this.gatewayRequested) {
      return;
    }
    this.gatewayRequested = true;
    try {
      const gatewayStatus = await this.props.httpClient.get('/api/v1/gateway/status');
      this.setState({ gatewayStatus });
      if (gatewayStatus.configured === true) {
        await this.getKeys();
      }
    } catch (e) {
      console.error(e);
    }
  };

  getKeys = async () => {
    this.setState({ gatewayKeysStatus: RequestStatus.Getting });
    try {
      const gatewayKeys = await this.props.httpClient.get('/api/v1/gateway/key');
      this.setState({ gatewayKeys, gatewayKeysStatus: RequestStatus.Success });
    } catch (e) {
      const error = get(e, 'response.data.error');
      this.setState({
        gatewayKeysStatus:
          error === ERROR_MESSAGES.NO_CONNECTED_TO_THE_INTERNET ? RequestStatus.NetworkError : RequestStatus.Error
      });
    }
  };

  getPlusUsers = async () => {
    if (!config.gatewayMode) {
      return;
    }
    this.setState({ plusUsersStatus: RequestStatus.Getting });
    try {
      const [plusUsers, plusMe] = await Promise.all([
        this.props.session.gatewayClient.getUsersInAccount(),
        this.props.session.gatewayClient.getMyself()
      ]);
      this.setState({ plusUsers, plusMe, plusUsersStatus: RequestStatus.Success });
    } catch (e) {
      console.error(e);
      this.setState({ plusUsersStatus: RequestStatus.Error });
    }
  };

  search = e => {
    this.setState({ search: e.target.value });
  };

  changeOrderDir = e => {
    this.setState({ orderDir: e.target.value });
  };

  // Authorize (or revoke) the encryption keys of a Gladys Plus user on the
  // instance. The whole list is saved, as the instance stores it: optimistic
  // on screen, back to what the instance enforces if it did not save it.
  switchUserKey = async (keysIndex, accepted) => {
    const previousKeys = this.state.gatewayKeys;
    const gatewayKeys = update(previousKeys, {
      [keysIndex]: {
        accepted: { $set: accepted },
        // the server forgets it too once the user is accepted again
        keys_changed: { $set: false }
      }
    });
    this.setState({ gatewayKeys, switchStatus: RequestStatus.Getting });
    try {
      await this.props.httpClient.patch('/api/v1/gateway/key', gatewayKeys);
      this.setState({ switchStatus: RequestStatus.Success });
    } catch (e) {
      console.error(e);
      this.setState({ gatewayKeys: previousKeys, switchStatus: RequestStatus.Error });
    }
  };

  deleteUser = async (user, callback) => {
    try {
      await this.props.httpClient.delete(`/api/v1/user/${user.selector}`);
      this.setState({ users: this.state.users.filter(existing => existing.id !== user.id) });
    } catch (e) {
      console.error(e);
      callback(e);
    }
  };

  // Invite someone to Gladys Plus for a Gladys user of the instance, from
  // that user's card: the invitation carries the Gladys user, so the account
  // created from it is linked to it without the invitee picking one.
  inviteUser = async ({ user, email, role }) => {
    const cleanedEmail = cleanEmail(email);
    if (!validateEmail(cleanedEmail)) {
      throw new Error(RequestStatus.ValidationError);
    }
    const invitation = await this.props.session.inviteUserForGladysUser({
      email: cleanedEmail,
      role,
      gladysUserId: user.id
    });
    this.setState({
      plusUsers: [
        ...(this.state.plusUsers || []),
        // the link is kept on screen whatever the Gateway echoes back
        { ...invitation, email: invitation.email || cleanedEmail, gladys_4_user_id: user.id, is_invitation: true }
      ]
    });
  };

  // remove a user (or cancel an invitation) from the Gladys Plus account
  revokeRemote = async remote => {
    this.setState({ revokeError: false });
    try {
      if (remote.isInvitation) {
        await this.props.session.gatewayClient.revokeInvitation(remote.id);
      } else {
        await this.props.session.gatewayClient.revokeUser(remote.id);
      }
      this.setState({
        plusUsers: (this.state.plusUsers || []).filter(plusUser => plusUser.id !== remote.id),
        // the instance drops the keys of a removed user on its next sync
        gatewayKeys: (this.state.gatewayKeys || []).filter(keys => keys.id !== remote.id)
      });
    } catch (e) {
      console.error(e);
      this.setState({ revokeError: true });
    }
  };

  componentDidMount() {
    this.getUsers();
    this.getGateway();
    this.getPlusUsers();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.user !== this.props.user) {
      this.getGateway();
    }
  }

  render(props, state) {
    const plusConfigured = get(state, 'gatewayStatus.configured') === true;
    const view = buildUsersView({
      users: state.users || [],
      gatewayKeys: plusConfigured ? state.gatewayKeys : null,
      plusUsers: plusConfigured || config.gatewayMode ? state.plusUsers : null,
      search: state.search,
      orderDir: state.orderDir
    });
    return (
      <SettingsLayout>
        <UserPage
          {...props}
          {...state}
          view={view}
          isAdmin={this.isAdmin()}
          isPlusAdmin={this.isPlusAdmin()}
          // local mode or gateway mode: in gateway mode the browser holds the
          // Plus token, so invitations and removals happen right here
          gatewayMode={config.gatewayMode}
          plusConfigured={plusConfigured}
          search={this.search}
          changeOrderDir={this.changeOrderDir}
          switchUserKey={this.switchUserKey}
          deleteUser={this.deleteUser}
          inviteUser={this.inviteUser}
          revokeRemote={this.revokeRemote}
        />
      </SettingsLayout>
    );
  }
}

export default connect('user,gatewayUserRole,httpClient,session', {})(SettingsUsers);
