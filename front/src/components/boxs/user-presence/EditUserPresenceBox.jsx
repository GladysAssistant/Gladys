import { Text } from 'preact-i18n';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';
import Select from 'react-select';
import BaseEditBox from '../baseEditBox';

const UserPresenceBox = ({ children, ...props }) => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.user-presence">
    <div class={props.loading ? 'dimmer active' : 'dimmer'}>
      <div class="loader" />
      <div class="dimmer-content">
        <div class="form-group">
          <label>
            <Text id="dashboard.boxes.userPresence.description" />
          </label>

          <Select
            class="choose-dashboard-user-presence-users"
            defaultValue={[]}
            value={props.selectedUsers}
            isMulti
            onChange={props.updateUsers}
            options={props.users}
          />
        </div>
      </div>
    </div>
  </BaseEditBox>
);

class EditUserPresence extends Component {
  getUsers = async () => {
    try {
      await this.setState({ loading: true });
      const users = await this.props.httpClient.get('/api/v1/user');
      const usersSelect = users.map(u => ({
        label: u.firstname,
        value: u.selector
      }));
      await this.setState({ users: usersSelect, loading: false });
      this.updateSelectedUsers();
    } catch (e) {
      await this.setState({ loading: false });
      console.error(e);
    }
  };

  updateSelectedUsers = () => {
    const selectedUsers = [];
    if (this.props.box.users) {
      this.props.box.users.forEach(userSelector => {
        const userInUserSelect = this.state.users.find(u => u.value === userSelector);
        if (userInUserSelect) {
          selectedUsers.push(userInUserSelect);
        }
      });
    }
    this.setState({ selectedUsers });
  };

  updateUsers = values => {
    let usersSelector = [];
    if (values) {
      usersSelector = values.map(u => u.value);
    }
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      users: usersSelector
    });
  };

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      users: [],
      selectedUsers: [],
      loading: false
    };
  }

  componentDidMount() {
    this.getUsers();
  }
  componentDidUpdate(prevProps) {
    if (get(prevProps, 'box.users') !== get(this.props, 'box.users')) {
      this.updateSelectedUsers();
    }
  }

  render(props, { users, selectedUsers, loading }) {
    return (
      <UserPresenceBox
        {...props}
        users={users}
        selectedUsers={selectedUsers}
        loading={loading}
        updateUsers={this.updateUsers}
      />
    );
  }
}

export default connect('httpClient', {})(EditUserPresence);
