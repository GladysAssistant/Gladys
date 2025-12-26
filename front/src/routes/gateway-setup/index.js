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
  selectUser = e => {
    this.setState({
      selectedUser: e.target.value
    });
  };
  saveUser = async () => {
    this.setState({ savingUserLoading: true });
    try {
      await this.props.session.gatewayClient.updateUserIdInGladys(this.state.selectedUser);
      await this.props.httpClient.get('/api/v1/me');
      // hard redirect, to reload websocket connection
      window.location = '/dashboard';
    } catch (e) {
      console.error(e);
      this.setState({ error: true });
    }
    this.setState({ savingUserLoading: false });
  };
  checkIfGladysUserIsLinkedToExistingUser = async () => {
    try {
      // We get the gateway user to check if they are already linked to a Gladys local user
      const gatewayUser = await this.props.session.gatewayClient.getMyself();

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
              this.setState({ errorNotAcceptedLocally: true });
            }
          }
          return;
        }
      }
    } catch (e) {
      console.error(e);
      this.setState({ error: true });
    }
  };
  init = async () => {
    await Promise.all([this.props.getUsers(), this.getSetupState()]);
    await this.checkIfGladysUserIsLinkedToExistingUser();
  };
  componentWillMount() {
    this.init();
  }
  render(props, { savingUserLoading, error, errorNotAcceptedLocally }) {
    const loading = savingUserLoading || props.usersGetStatus === RequestStatus.Getting;
    return (
      <LinkGatewayUserPage
        {...props}
        error={error}
        errorNotAcceptedLocally={errorNotAcceptedLocally}
        selectUser={this.selectUser}
        saveUser={this.saveUser}
        loading={loading}
        openStripeBilling={this.openStripeBilling}
      />
    );
  }
}

export default connect('users,usersGetStatus,session,httpClient', actions)(LinkGatewayUser);
