import Select from 'react-select';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Localizer, Text } from 'preact-i18n';

import get from 'get-value';

import TextWithVariablesInjected from '../../../../components/scene/TextWithVariablesInjected';
import withIntlAsProp from '../../../../utils/withIntlAsProp';

const ALL_USERS_VALUE = 'all';

class SendSms extends Component {
  getOptions = async () => {
    try {
      const users = await this.props.httpClient.get('/api/v1/user');
      const userOptions = [
        {
          label: get(this.props.intl.dictionary, 'editScene.actionsCard.smsSend.allUsersOption'),
          value: ALL_USERS_VALUE
        }
      ];
      users.forEach(user => {
        userOptions.push({
          label: user.firstname,
          value: user.selector
        });
      });
      let selectedOption = userOptions[0];
      if (this.props.action.user) {
        selectedOption = userOptions.find(option => option.value === this.props.action.user) || userOptions[0];
      } else {
        this.props.updateActionProperty(this.props.path, 'user', ALL_USERS_VALUE);
      }
      this.setState({ userOptions, selectedOption });
    } catch (e) {
      console.error(e);
    }
  };
  updateText = text => {
    this.props.updateActionProperty(this.props.path, 'text', text);
  };
  handleChange = selectedOption => {
    if (selectedOption && selectedOption.value) {
      this.props.updateActionProperty(this.props.path, 'user', selectedOption.value);
    } else {
      this.props.updateActionProperty(this.props.path, 'user', null);
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
      selectedOption: '',
      userOptions: []
    };
  }
  componentDidMount() {
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
            <Text id="editScene.actionsCard.smsSend.userLabel" />
          </label>
          <Select
            styles={{
              // Fixes the overlapping problem of the component
              menu: provided => ({ ...provided, zIndex: 2 })
            }}
            options={userOptions}
            value={selectedOption}
            onChange={this.handleChange}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.smsSend.textLabel" />{' '}
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <div class="mb-1 small">
            <Text id="editScene.actionsCard.smsSend.explanationText" />
          </div>
          <Localizer>
            <TextWithVariablesInjected
              text={props.action.text}
              path={props.path}
              triggersVariables={props.triggersVariables}
              actionsGroupsBefore={props.actionsGroupsBefore}
              variables={props.variables}
              updateText={this.updateText}
              placeholder={<Text id="editScene.actionsCard.smsSend.messagePlaceholder" />}
            />
          </Localizer>
        </div>
      </div>
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(SendSms));
