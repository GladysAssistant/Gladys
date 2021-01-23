import { Component } from 'preact';
import { connect } from 'unistore/preact';
import UserPage from './UserPage';
import actions from '../../../actions/house';
import SettingsLayout from '../SettingsLayout';

@connect('currentUrl,httpClient', actions)
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
    return (
      <SettingsLayout currentUrl={props.currentUrl}>
        <UserPage {...props} users={users} />
      </SettingsLayout>
    );
  }
}

export default SettingsUsers;
