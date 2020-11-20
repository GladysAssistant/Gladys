import { Component } from 'preact';
import { connect } from 'unistore/preact';
import LinkGatewayUserPage from './LinkGatewayUser';
import actions from '../../actions/gatewayLinkUser';
import { route } from 'preact-router';
import { RequestStatus } from '../../utils/consts';

@connect('users,usersGetStatus,session', actions)
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
      await this.props.saveUser(this.state.selectedUser);
      this.setState({ savingUserLoading: false });
      route('/dashboard');
    } catch (e) {
      console.log(e);
      this.setState({ savingUserLoading: false, error: true });
    }
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

export default LinkGatewayUser;
