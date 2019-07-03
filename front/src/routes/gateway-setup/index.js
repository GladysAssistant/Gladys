import { Component } from 'preact';
import { connect } from 'unistore/preact';
import LinkGatewayUserPage from './LinkGatewayUser';
import actions from '../../actions/gatewayLinkUser';
import { route } from 'preact-router';

@connect(
  'users',
  actions
)
class LinkGatewayUser extends Component {
  selectUser = e => {
    this.setState({
      selectedUser: e.target.value
    });
  };
  saveUser = async () => {
    this.setState({ loading: true });
    try {
      await this.props.saveUser(this.state.selectedUser);
      this.setState({ loading: false });
      route('/dashboard');
    } catch (e) {
      this.setState({ loading: false });
    }
  };
  componentWillMount() {
    this.props.getUsers();
  }
  render(props, { loading }) {
    return <LinkGatewayUserPage {...props} selectUser={this.selectUser} saveUser={this.saveUser} loading={loading} />;
  }
}

export default LinkGatewayUser;
