import { Component } from 'preact';
import { connect } from 'unistore/preact';
import LinkGatewayUserPage from './LinkGatewayUser';
import actions from '../../actions/gatewayLinkUser';
import { route } from 'preact-router';
import { RequestStatus } from '../../utils/consts';

@connect(
  'users,usersGetStatus',
  actions
)
class LinkGatewayUser extends Component {
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
      this.setState({ savingUserLoading: false });
    }
  };
  componentWillMount() {
    this.props.getUsers();
  }
  render(props, { savingUserLoading }) {
    const loading = savingUserLoading || props.usersGetStatus === RequestStatus.Getting;
    return <LinkGatewayUserPage {...props} selectUser={this.selectUser} saveUser={this.saveUser} loading={loading} />;
  }
}

export default LinkGatewayUser;
