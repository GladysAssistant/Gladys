import Select from 'react-select';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';

@connect('httpClient', {})
class SendMessageParams extends Component {
  getOptions = async () => {
    try {
      const users = await this.props.httpClient.get('/api/v1/user');
      const userOptions = [];
      users.forEach(user => {
        userOptions.push({
          label: user.firstname,
          value: user.selector
        });
      });
      await this.setState({ userOptions });
      this.refreshSelectedOptions(this.props);
      return userOptions;
    } catch (e) {}
  };
  handleChangeText = e => {
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'text', e.target.value);
  };
  handleChange = selectedOption => {
    if (selectedOption && selectedOption.value) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'user', selectedOption.value);
    } else {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'user', null);
    }
  };
  refreshSelectedOptions = nextProps => {
    let selectedOption = '';
    if (nextProps.action.user && this.state.userOptions) {
      const userOption = this.state.userOptions.find(option => option.value === nextProps.action.user);

      if (userOption) {
        selectedOption = userOption;
      }
    }
    this.setState({ selectedOption });
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      selectedOption: ''
    };
  }
  componentDidMount() {
    if (!this.props.unit) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'unit', 'seconds');
    }
    this.getOptions();
  }
  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }
  render(props, { selectedOption, userOptions }) {
    return (
      <div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.messageSend.userLabel" />
            <span class="form-required">*</span>
          </label>
          <Select options={userOptions} value={selectedOption} onChange={this.handleChange} />
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.messageSend.textLabel" /> <span class="form-required">*</span>
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
