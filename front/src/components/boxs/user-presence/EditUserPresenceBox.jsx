import { Text } from 'preact-i18n';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';
import Select from '../../form/Select';
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
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>
        {[
          ['presence_show_lastname', 'showLastname', false],
          ['presence_show_away_since', 'showAwaySince', true],
          ['presence_show_home_since', 'showHomeSince', false]
        ].map(([field, label, defaultValue]) => (
          <div class="form-group" key={field}>
            <label class="custom-switch">
              <input
                type="checkbox"
                name={field}
                class="custom-switch-input"
                checked={props.box[field] === undefined ? defaultValue : props.box[field]}
                onChange={e => props.updateBoxConfig(props.x, props.y, { [field]: e.target.checked })}
              />
              <span class="custom-switch-indicator" />
              <span class="custom-switch-description">
                <Text id={`dashboard.boxes.userPresence.${label}`} />
              </span>
            </label>
          </div>
        ))}
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
        label: users.some(other => other.selector !== u.selector && other.firstname === u.firstname)
          ? `${u.firstname} (${u.selector})`
          : u.firstname,
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
