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
    searchTerms: '',
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

  // The Gladys Plus status is readable by anyone; the keys are an admin route
  getGateway = async () => {
    if (this.gatewayRequested) {
      return;
    }
    this.gatewayRequested = true;
    let gatewayStatus;
    try {
      gatewayStatus = await this.props.httpClient.get('/api/v1/gateway/status');
      this.setState({ gatewayStatus });
    } catch (e) {
      console.error(e);
      // a later call (the logged user arriving, for instance) retries
      this.gatewayRequested = false;
      return;
    }
    // the status just received, not the state (not committed yet)
    await this.getKeysIfAdmin(gatewayStatus);
  };

  // the logged user can still be loading when the page mounts: this runs
  // again when they arrive (componentDidUpdate)
  getKeysIfAdmin = async (gatewayStatus = this.state.gatewayStatus) => {
    const configured = get(gatewayStatus, 'configured') === true;
    if (!configured || !this.isAdmin() || this.keysRequested) {
      return;
    }
    this.keysRequested = true;
    await this.getKeys();
  };

  getKeys = async () => {
    this.setState({ gatewayKeysStatus: RequestStatus.Getting });
    try {
      const gatewayKeys = await this.props.httpClient.get('/api/v1/gateway/key');
      this.setState({ gatewayKeys, gatewayKeysStatus: RequestStatus.Success });
    } catch (e) {
      const error = get(e, 'response.data.error');
      // the next logged-user change asks for the keys again
      this.keysRequested = false;
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
    // independent: the list is worth showing even when the profile fails
    // (isPlusAdmin falls back on the role read at login)
    const [plusUsersResult, plusMeResult] = await Promise.allSettled([
      this.props.session.gatewayClient.getUsersInAccount(),
      this.props.session.gatewayClient.getMyself()
    ]);
    if (plusMeResult.status === 'fulfilled') {
      this.setState({ plusMe: plusMeResult.value });
    } else {
      console.error(plusMeResult.reason);
    }
    if (plusUsersResult.status === 'fulfilled') {
      this.setState({ plusUsers: plusUsersResult.value, plusUsersStatus: RequestStatus.Success });
    } else {
      console.error(plusUsersResult.reason);
      this.setState({ plusUsersStatus: RequestStatus.Error });
    }
  };

  search = e => {
    this.setState({ searchTerms: e.target.value });
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

  // Attach a Gladys Plus account (or a pending invitation) to a Gladys user of the
  // instance, as a Plus admin: for accounts created before the linked invitations,
  // or recognized by their email on a user's card. The instance learns the link on
  // its next sync of the keys, asked right away.
  linkRemote = async (remote, gladysUserId) => {
    if (remote.isInvitation) {
      await this.props.session.linkInvitationToGladysUser(remote.id, gladysUserId);
    } else {
      await this.props.session.linkAccountUserToGladysUser(remote.id, gladysUserId);
    }
    this.setState({
      plusUsers: (this.state.plusUsers || []).map(plusUser =>
        plusUser.id === remote.id ? { ...plusUser, gladys_4_user_id: gladysUserId } : plusUser
      ),
      gatewayKeys: (this.state.gatewayKeys || []).map(keys =>
        keys.id === remote.id ? { ...keys, gladys_4_user_id: gladysUserId } : keys
      )
    });
    if (remote.keys) {
      await this.getKeys();
    }
  };

  // Gladys Plus recovery codes of a user who lost both their two-factor app and their
  // recovery codes, generated from this instance (which stands in for their second
  // factor): local admin, local mode only (the server refuses the Gladys Plus tunnel),
  // and the admin proves it is them with their local password
  generateRemoteRecoveryCodes = async (remote, password) =>
    this.props.httpClient.post(`/api/v1/gateway/user/${encodeURIComponent(remote.id)}/recovery-codes`, { password });

  // Reset the two factor of a Plus user who lost their authenticator (Plus admin,
  // confirming with their own code): the user signs in with their password and sets
  // up a new authenticator; their keys and local authorization do not change
  resetRemoteTwoFactor = async (remote, twoFactorCode) => {
    await this.props.session.resetAccountUserTwoFactor(remote.id, twoFactorCode);
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
      this.getKeysIfAdmin();
    }
  }

  render(props, state) {
    // in gateway mode the page is reached through Gladys Plus: the instance is
    // configured whatever the status request says (or before it answers)
    const plusConfigured = config.gatewayMode || get(state, 'gatewayStatus.configured') === true;
    const view = buildUsersView({
      users: state.users || [],
      gatewayKeys: plusConfigured ? state.gatewayKeys : null,
      plusUsers: plusConfigured ? state.plusUsers : null,
      search: state.searchTerms,
      orderDir: state.orderDir
    });
    // the remote access of every row waits for the keys: one loader, no
    // "no remote access" flashing before "authorized"
    const loading =
      state.loading ||
      state.gatewayKeysStatus === RequestStatus.Getting ||
      (config.gatewayMode && state.plusUsersStatus === RequestStatus.Getting);
    return (
      <SettingsLayout>
        <UserPage
          {...props}
          {...state}
          loading={loading}
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
          linkRemote={this.linkRemote}
          resetRemoteTwoFactor={this.resetRemoteTwoFactor}
          generateRemoteRecoveryCodes={this.generateRemoteRecoveryCodes}
          revokeRemote={this.revokeRemote}
        />
      </SettingsLayout>
    );
  }
}

export default connect('user,gatewayUserRole,httpClient,session', {})(SettingsUsers);
