import Select from 'react-select';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';

@connect('httpClient', {})
class SendMessageParams extends Component {
  getOptions = async () => {
    try {
      const users = await this.props.httpClient.get('/api/v1/user');
      const services = await this.props.httpClient.get('/api/v1/service');
      const userOptions = [];
      const serviceOptions = [];

      users.forEach(user => {
        userOptions.push({
          label: user.firstname,
          value: user.selector
        });
      });

      const supportedServices = ['pushover', 'telegram'];
      services.forEach(service => {
        if (service.status === 'RUNNING' && supportedServices.indexOf(service.name) > -1) {
          serviceOptions.push({
            label: service.name.charAt(0).toUpperCase() + service.name.slice(1),
            value: service.selector
          });
        }
      });

      await this.setState({ userOptions, serviceOptions });
      this.refreshSelectedOptions(this.props);
      return userOptions;
    } catch (e) {
      console.log(e);
    }
  };
  handleChangeText = e => {
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'text', e.target.value);
  };
  handleChangeUser = selectedUserOption => {
    if (selectedUserOption && selectedUserOption.value) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'user', selectedUserOption.value);
    } else {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'user', null);
    }
  };
  handleChangeService = selectedServiceOption => {
    if (selectedServiceOption && selectedServiceOption.value) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'service', selectedServiceOption.value);
    } else {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'service', null);
    }
  };
  refreshSelectedOptions = nextProps => {
    let selectedUserOption = '';
    let selectedServiceOption = '';
    if (nextProps.action.user && this.state.userOptions) {
      const userOption = this.state.userOptions.find(option => option.value === nextProps.action.user);
      if (userOption) {
        selectedUserOption = userOption;
      }
    }
    if (nextProps.action.service && this.state.serviceOptions) {
      const serviceOption = this.state.serviceOptions.find(option => option.value === nextProps.action.service);
      if (serviceOption) {
        selectedServiceOption = serviceOption;
      }
    }
    this.setState({ selectedUserOption, selectedServiceOption });
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      selectedUserOption: '',
      selectedServiceOption: ''
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
  render(props, { selectedUserOption, userOptions, selectedServiceOption, serviceOptions }) {
    return (
      <div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.messageSend.userLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Select options={userOptions} value={selectedUserOption} onChange={this.handleChangeUser} />
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.messageSend.serviceLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Select options={serviceOptions} value={selectedServiceOption} onChange={this.handleChangeService} />
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
