import { Component } from 'preact';
import { connect } from 'unistore/preact';
import update from 'immutability-helper';
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
      console.error(e);
    }
  };
  removeUserFromList = index => {
    this.setState(
      update(this.state, {
        users: {
          $splice: [[index, 1]]
        }
      })
    );
  };
  componentDidMount() {
    this.getUsers();
  }

  render(props, { users }) {
    return (
      <SettingsLayout currentUrl={props.currentUrl}>
        <UserPage {...props} users={users} removeUserFromList={this.removeUserFromList} />
      </SettingsLayout>
    );
  }
}

export default SettingsUsers;
