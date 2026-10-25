import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';
import LinkGatewayUserPage from './LinkGatewayUser';
import actions from '../../actions/gatewayLinkUser';
import { RequestStatus } from '../../utils/consts';

class LinkGatewayUser extends Component {
  getSetupState = async () => {
    await this.setState({ loading: true });
    const setupState = await this.props.session.gatewayClient.getSetupState();
    this.setState({
      setupState,
      loading: false
    });
  };
  openStripeBilling = async () => {
    window.open(
      `${this.props.session.gladysGatewayApiUrl}/accounts/stripe_customer_portal/${this.state.setupState.stripe_portal_key}`
    );
  };
  logout = async e => {
    if (e) {
      e.preventDefault();
    }
    try {
      // We try to revoke the session, but this call goes through the local Gladys
      // instance: it can fail when the instance is disconnected, which is precisely
      // the case where the user is stuck on this page. We log out locally anyway.
      const user = this.props.session.getUser();
      if (user && user.session_id) {
        await this.props.httpClient.post(`/api/v1/session/${user.session_id}/revoke`);
      }
    } catch (error) {
      console.error(error);
    }
    this.props.session.reset();
    window.location = '/login';
  };
  selectUser = e => {
    this.setState({
      selectedUser: e.target.value
    });
  };
  saveUser = async () => {
    this.setState({ savingUserLoading: true });
    try {
      await this.props.session.gatewayClient.updateUserIdInGladys(this.state.selectedUser);
      // Hard redirect to /dashboard to force a fresh websocket session against the
      // gateway. The previous session was opened at login time with no local_user_id
      // (or a stale one), so any call to a local Gladys API right now would fail with
      // GATEWAY_USER_NOT_LINKED. If the user has not been accepted locally yet,
      // checkSession / checkIfGladysUserIsLinkedToExistingUser will detect it after
      // the reload and show the proper "errorNotAcceptedLocally" message.
      window.location = '/dashboard';
    } catch (e) {
      console.error(e);
      this.setState({ error: true });
    }
    this.setState({ savingUserLoading: false });
  };
  // Resolves with true when the instance does not accept this Gladys Plus user
  checkIfGladysUserIsLinkedToExistingUser = async () => {
    let notAcceptedLocally = false;
    let notAcceptedLocallyReason = null;
    try {
      // We get the gateway user to check if they are already linked to a Gladys local user
      const gatewayUser = await this.props.session.gatewayClient.getMyself();
      if (gatewayUser) {
        // only an admin of the instance can authorize a user: the page tells the other
        // members of the household to ask them
        this.setState({ gatewayUserRole: gatewayUser.role });
      }

      // If the gateway gladys_4_user_id is defined and is equal to a local user, we redirect
      // automatically to the dashboard, as it's not necessary to select a user again
      if (gatewayUser && gatewayUser.gladys_4_user_id && this.props.users) {
        const userIndeedExists = this.props.users.find(user => user.id === gatewayUser.gladys_4_user_id);
        if (userIndeedExists) {
          // We try to get the user details to confirm they still exist
          try {
            await this.props.httpClient.get('/api/v1/me');
            // hard redirect, to reload websocket connection
            window.location = '/dashboard';
          } catch (e) {
            console.error(e);
            const error = get(e, 'response.data.error');
            if (error === 'USER_NOT_ACCEPTED_LOCALLY') {
              notAcceptedLocally = true;
              // KEYS_CHANGED or NOT_ACCEPTED, missing on instances older than this page
              notAcceptedLocallyReason = get(e, 'response.data.reason') || null;
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
      this.setState({ error: true });
    }
    this.setState({ errorNotAcceptedLocally: notAcceptedLocally, notAcceptedLocallyReason });
    return notAcceptedLocally;
  };
  init = async () => {
    await Promise.all([this.props.getUsers(), this.getSetupState()]);
    return this.checkIfGladysUserIsLinkedToExistingUser();
  };
  retry = async e => {
    if (e) {
      e.preventDefault();
    }
    // errorNotAcceptedLocally is kept during the retry, so the page keeps displaying
    // the same guide under the loading dimmer
    this.setState({ error: false, stillNotAcceptedLocally: false, retrying: true });
    try {
      const notAcceptedLocally = await this.init();
      // without this, a retry that fails again looks like a button that does nothing
      this.setState({ stillNotAcceptedLocally: notAcceptedLocally });
    } catch (err) {
      console.error(err);
      this.setState({ error: true });
    } finally {
      this.setState({ retrying: false });
    }
  };
  componentWillMount() {
    this.init();
  }
  render(
    props,
    {
      savingUserLoading,
      error,
      errorNotAcceptedLocally,
      notAcceptedLocallyReason,
      stillNotAcceptedLocally,
      gatewayUserRole,
      retrying
    }
  ) {
    const loading = savingUserLoading || retrying || props.usersGetStatus === RequestStatus.Getting;
    // While retrying, we keep displaying the step-by-step guide (under the loading
    // dimmer) instead of flashing the user-select form during the "Getting" state.
    const usersGetStatus =
      retrying && !errorNotAcceptedLocally && props.usersGetStatus === RequestStatus.Getting
        ? RequestStatus.GatewayNoInstanceFound
        : props.usersGetStatus;
    return (
      <LinkGatewayUserPage
        {...props}
        usersGetStatus={usersGetStatus}
        error={error}
        errorNotAcceptedLocally={errorNotAcceptedLocally}
        notAcceptedLocallyReason={notAcceptedLocallyReason}
        stillNotAcceptedLocally={stillNotAcceptedLocally}
        isGatewayAdmin={gatewayUserRole === 'admin'}
        keysFingerprints={props.session.getKeysFingerprints()}
        selectUser={this.selectUser}
        saveUser={this.saveUser}
        retry={this.retry}
        loading={loading}
        openStripeBilling={this.openStripeBilling}
        logout={this.logout}
      />
    );
  }
}

export default connect('users,usersGetStatus,session,httpClient', actions)(LinkGatewayUser);
