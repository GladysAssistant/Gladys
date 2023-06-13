import { Component } from 'preact';
import { connect } from 'unistore/preact';
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
  componentWillMount() {
    this.props.getUsers();
    this.getSetupState();
  }
  render(props, { savingUserLoading, error }) {
    const loading = savingUserLoading || props.usersGetStatus === RequestStatus.Getting;
    return (
      <LinkGatewayUserPage
        {...props}
        error={error}
        selectUser={this.selectUser}
        saveUser={this.saveUser}
        loading={loading}
        openStripeBilling={this.openStripeBilling}
      />
    );
  }
}

export default connect('users,usersGetStatus,session,httpClient', actions)(LinkGatewayUser);
