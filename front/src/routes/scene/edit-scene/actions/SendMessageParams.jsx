import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import Select from '../../../../components/form/Select';

@connect('httpClient', {})
class SendMessageParams extends Component {
  getOptions = async () => {
    this.setState({ loading: true });
    try {
      const users = await this.props.httpClient.get('/api/v1/user');
      await this.setState({ users, loading: false });
      this.refreshselectedUsers(this.props);
      return users;
    } catch (e) {
      console.log(e);
    }
    this.setState({ loading: false });
  };
  handleChangeText = e => {
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'text', e.target.value);
  };
  handleChange = selectedUser => {
    if (selectedUser && selectedUser.selector) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'user', selectedUser.selector);
    } else {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'user', null);
    }
  };
  refreshselectedUsers = nextProps => {
    let selectedUser = '';
    if (nextProps.action.user && this.state.users) {
      const user = this.state.users.find(option => option.selector === nextProps.action.user);

      if (user) {
        selectedUser = user;
      }
    }
    this.setState({ selectedUser });
  };
  componentDidMount() {
    if (!this.props.unit) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'unit', 'seconds');
    }
    this.getOptions();
  }
  componentWillReceiveProps(nextProps) {
    this.refreshselectedUsers(nextProps);
  }
  render(props, { selectedUser, users, loading }) {
    return (
      <div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.messageSend.userLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Select
            options={users}
            value={selectedUser}
            onChange={this.handleChange}
            searchable
            loading={loading}
            itemLabelKey="firstname"
          />
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.messageSend.textLabel" />{' '}
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Localizer>
            <textarea
              class="form-control"
              value={props.action.text}
              onChange={this.handleChangeText}
              placeholder={<Text id="editScene.actionsCard.messageSend.textPlaceholder" />}
            />
          </Localizer>
        </div>
      </div>
    );
  }
}

export default SendMessageParams;
