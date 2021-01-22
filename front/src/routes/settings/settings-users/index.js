import { Component } from 'preact';
import { connect } from 'unistore/preact';
import UserPage from './UserPage';
import actions from '../../../actions/house';

@connect('httpClient', actions)
class SettingsUsers extends Component {
  getUsers = async () => {
    try {
      const users = await this.props.httpClient.get('/api/v1/user?fields=id,firstname,lastname,selector,role,picture');
      this.setState({ users });
    } catch (e) {
      console.log(e);
    }
  };
  componentDidMount() {
    this.getUsers();
  }

  render(props, { users }) {
    return <UserPage {...props} users={users} />;
  }
}

export default SettingsUsers;
