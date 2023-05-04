import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

import Select from 'react-select';
import { EVENTS } from '../../../../../../server/utils/constants';

class UserPresenceTrigger extends Component {
  getOptions = async () => {
    try {
      const [users, areas] = await Promise.all([
        this.props.httpClient.get('/api/v1/user'),
        this.props.httpClient.get('/api/v1/area')
      ]);
      const userOptions = [];
      users.forEach(user => {
        userOptions.push({
          label: user.firstname,
          value: user.selector
        });
      });
      const areaOptions = [];
      areas.forEach(area => {
        areaOptions.push({
          label: area.name,
          value: area.selector
        });
      });
      await this.setState({ userOptions, areaOptions });
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
  handleAreaChange = selectedOption => {
    if (selectedOption && selectedOption.value) {
      this.props.updateTriggerProperty(this.props.index, 'area', selectedOption.value);
    } else {
      this.props.updateTriggerProperty(this.props.index, 'area', null);
    }
  };
  refreshSelectedOptions = nextProps => {
    let selectedOption = '';
    let selectedAreaOption = '';
    if (nextProps.trigger.user && this.state.userOptions) {
      const userOption = this.state.userOptions.find(option => option.value === nextProps.trigger.user);

      if (userOption) {
        selectedOption = userOption;
      }
    }
    if (nextProps.trigger.area && this.state.areaOptions) {
      const areaOption = this.state.areaOptions.find(option => option.value === nextProps.trigger.area);

      if (areaOption) {
        selectedAreaOption = areaOption;
      }
    }
    this.setState({ selectedOption, selectedAreaOption });
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      selectedOption: '',
      selectedAreaOption: ''
    };
  }
  componentDidMount() {
    this.getOptions();
  }
  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }

  render(props, { userOptions, selectedOption, areaOptions, selectedAreaOption }) {
    return (
      <div>
        <p>
          {props.trigger.type === EVENTS.AREA.USER_ENTERED && (
            <Text id="editScene.triggersCard.area.userEnteredDescription" />
          )}
          {props.trigger.type === EVENTS.AREA.USER_LEFT && (
            <Text id="editScene.triggersCard.area.userLeftDescription" />
          )}
        </p>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.triggersCard.area.userLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Select options={userOptions} value={selectedOption} onChange={this.handleChange} />
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.triggersCard.area.areaLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Select options={areaOptions} value={selectedAreaOption} onChange={this.handleAreaChange} />
        </div>
      </div>
    );
  }
}

export default connect('httpClient,user', {})(UserPresenceTrigger);
