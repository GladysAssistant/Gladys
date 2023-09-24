import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import { EVENTS } from '../../../../../../server/utils/constants';

class UserPresenceTrigger extends Component {
  getOptions = async () => {
    try {
      const [users, houses] = await Promise.all([
        this.props.httpClient.get('/api/v1/user'),
        this.props.httpClient.get('/api/v1/house')
      ]);
      const userOptions = [];
      users.forEach(user => {
        userOptions.push({
          label: user.firstname,
          value: user.selector
        });
      });
      const houseOptions = [];
      houses.forEach(house => {
        houseOptions.push({
          label: house.name,
          value: house.selector
        });
      });
      await this.setState({ userOptions, houseOptions });
      this.refreshSelectedOptions(this.props);
      return userOptions;
    } catch (e) {
      console.error(e);
    }
  };

  handleChange = selectedOption => {
    if (selectedOption && selectedOption.value) {
      this.props.updateTriggerProperty(this.props.index, 'user', selectedOption.value);
    } else {
      this.props.updateTriggerProperty(this.props.index, 'user', null);
    }
  };
  handleHouseChange = selectedOption => {
    if (selectedOption && selectedOption.value) {
      this.props.updateTriggerProperty(this.props.index, 'house', selectedOption.value);
    } else {
      this.props.updateTriggerProperty(this.props.index, 'house', null);
    }
  };
  refreshSelectedOptions = nextProps => {
    let selectedOption = '';
    let selectedHouseOption = '';
    if (nextProps.trigger.user && this.state.userOptions) {
      const userOption = this.state.userOptions.find(option => option.value === nextProps.trigger.user);

      if (userOption) {
        selectedOption = userOption;
      }
    }
    if (nextProps.trigger.house && this.state.houseOptions) {
      const houseOption = this.state.houseOptions.find(option => option.value === nextProps.trigger.house);

      if (houseOption) {
        selectedHouseOption = houseOption;
      }
    }
    this.setState({ selectedOption, selectedHouseOption });
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      selectedOption: '',
      selectedHouseOption: ''
    };
  }
  componentDidMount() {
    this.getOptions();
  }
  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }

  render(props, { userOptions, selectedOption, houseOptions, selectedHouseOption }) {
    return (
      <div>
        <p>
          {props.trigger.type === EVENTS.USER_PRESENCE.BACK_HOME && (
            <Text id="editScene.triggersCard.userPresence.backAtHomeDescription" />
          )}
          {props.trigger.type === EVENTS.USER_PRESENCE.LEFT_HOME && (
            <Text id="editScene.triggersCard.userPresence.leftHomeDescription" />
          )}
        </p>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.triggersCard.userPresence.userLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Select options={userOptions} value={selectedOption} onChange={this.handleChange} />
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.triggersCard.userPresence.houseLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Select options={houseOptions} value={selectedHouseOption} onChange={this.handleHouseChange} />
        </div>
      </div>
    );
  }
}

export default connect('httpClient,user', {})(UserPresenceTrigger);
