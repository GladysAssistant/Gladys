import { Component } from 'preact';
import { connect } from 'unistore/preact';
import update from 'immutability-helper';
import UserPage from './UserPage';
import actions from '../../../actions/house';
import SettingsLayout from '../SettingsLayout';

class SettingsUsers extends Component {
  getUsers = async () => {
    try {
      await this.setState({ loading: true });
      const params = {
        fields: 'id,firstname,lastname,selector,role,picture',
        order_dir: this.state.getUsersOrderDir || 'asc'
      };
      if (this.state.userSearchTerms && this.state.userSearchTerms.length) {
        params.search = this.state.userSearchTerms;
      }
      const users = await this.props.httpClient.get('/api/v1/user', params);
      this.setState({ users, loading: false });
    } catch (e) {
      console.error(e);
      this.setState({ loading: false });
    }
  };
  search = async e => {
    await this.setState({ userSearchTerms: e.target.value });
    this.getUsers();
  };
  changeOrderDir = async e => {
    await this.setState({
      getUsersOrderDir: e.target.value
    });
    this.getUsers();
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

  render(props, { users, userSearchTerms, loading }) {
    return (
      <SettingsLayout currentUrl={props.currentUrl}>
        <UserPage
          {...props}
          users={users}
          search={this.search}
          removeUserFromList={this.removeUserFromList}
          userSearchTerms={userSearchTerms}
          changeOrderDir={this.changeOrderDir}
          loading={loading}
        />
      </SettingsLayout>
    );
  }
}

export default connect('currentUrl,httpClient,user', actions)(SettingsUsers);
