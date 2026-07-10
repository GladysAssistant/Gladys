import Select from 'react-select';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import get from 'get-value';
import withIntlAsProp from '../../../../utils/withIntlAsProp';

import TextWithVariablesInjected from '../../../../components/scene/TextWithVariablesInjected';

const DAY_OPTIONS = [
  { value: 'J', labelKey: 'editScene.actionsCard.sendVigilanceMap.dayToday' },
  { value: 'J1', labelKey: 'editScene.actionsCard.sendVigilanceMap.dayTomorrow' }
];

class SendVigilanceMapParams extends Component {
  getOptions = async () => {
    try {
      const users = await this.props.httpClient.get('/api/v1/user');
      const userOptions = users.map(user => ({
        label: user.firstname,
        value: user.selector
      }));

      let selectedUserOption = '';
      const actionUpdates = [];
      if (!this.props.action.user && userOptions.length > 0) {
        actionUpdates.push(['user', userOptions[0].value]);
        selectedUserOption = userOptions[0];
      } else if (this.props.action.user) {
        selectedUserOption = userOptions.find(option => option.value === this.props.action.user) || '';
      }
      if (!this.props.action.day) {
        actionUpdates.push(['day', 'J']);
      }
      this.setState({ userOptions, selectedUserOption }, () => {
        actionUpdates.forEach(([key, value]) => this.props.updateActionProperty(this.props.path, key, value));
      });
      return userOptions;
    } catch (e) {
      console.error(e);
    }
  };
  updateText = text => {
    this.props.updateActionProperty(this.props.path, 'text', text);
  };
  handleUserChange = selectedOption => {
    if (selectedOption && selectedOption.value) {
      this.props.updateActionProperty(this.props.path, 'user', selectedOption.value);
    } else {
      this.props.updateActionProperty(this.props.path, 'user', null);
    }
  };
  handleDayChange = e => {
    this.props.updateActionProperty(this.props.path, 'day', e.target.value);
  };

  refreshSelectedOptions = nextProps => {
    let selectedUserOption = '';
    if (nextProps.action.user && this.state.userOptions) {
      const userOption = this.state.userOptions.find(option => option.value === nextProps.action.user);

      if (userOption) {
        selectedUserOption = userOption;
      }
    }
    this.setState({ selectedUserOption });
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      selectedOption: ''
    };
  }
  componentDidMount() {
    this.getOptions();
  }
  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }
  render(props, { selectedUserOption, userOptions }) {
    return (
      <div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.sendVigilanceMap.userLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Select
            styles={{
              // Fixes the overlapping problem of the component
              menu: provided => ({ ...provided, zIndex: 2 })
            }}
            options={userOptions}
            value={selectedUserOption}
            onChange={this.handleUserChange}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.sendVigilanceMap.dayLabel" />
          </label>
          <select onChange={this.handleDayChange} class="form-control" value={props.action.day || 'J'}>
            {DAY_OPTIONS.map(option => (
              <option value={option.value} selected={(props.action.day || 'J') === option.value}>
                {get(props.intl.dictionary, option.labelKey, { default: option.value })}
              </option>
            ))}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.sendVigilanceMap.textLabel" />
          </label>
          <div class="mb-1 small">
            <Text id="editScene.actionsCard.sendVigilanceMap.explanationText" />
          </div>
          <div className="tags-input">
            <TextWithVariablesInjected
              text={props.action.text}
              path={props.path}
              triggersVariables={props.triggersVariables}
              actionsGroupsBefore={props.actionsGroupsBefore}
              variables={props.variables}
              updateText={this.updateText}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(SendVigilanceMapParams));
