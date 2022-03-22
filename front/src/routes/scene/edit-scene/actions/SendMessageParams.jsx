import Select from 'react-select';
import Tagify from '@yaireo/tagify';
import '@yaireo/tagify/dist/tagify.css';
import { Component } from 'preact';
import get from 'get-value';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

const helpTextStyle = {
  fontSize: 12,
  marginBottom: '.375rem'
};

const OPENING_VARIABLE = '{{';
const CLOSING_VARIABLE = '}}';

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
    } catch (e) {
      console.error(e);
    }
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
  refreshVariables = async nextProps => {
    const variableWhileList = [];
    let variablesKey = '';
    let variableReady = null;
    // Action variables
    nextProps.actionsGroupsBefore.forEach((actionGroup, groupIndex) => {
      actionGroup.forEach((action, index) => {
        if (nextProps.variables[groupIndex][index]) {
          nextProps.variables[groupIndex][index].forEach(option => {
            if (option.ready && variableReady === null) {
              variableReady = true;
            }
            if (!option.ready) {
              variableReady = false;
            }
            // we create a "variablesKey" string to quickly compare the variables displayed
            // instead of having to loop through 2 arrays. It's quicker :)
            variablesKey += `${groupIndex}.${index}.${option.name}.${option.label}.${option.ready}`;
            variableWhileList.push({
              id: `${groupIndex}.${index}.${option.name}`,
              text: `${groupIndex + 1}. ${index + 1}. ${option.label}`,
              title: `${groupIndex + 1}. ${index + 1}. ${option.label}`,
              value: `${groupIndex}.${index}.${option.name}`
            });
          });
        }
      });
    });
    // Triggers variables
    nextProps.triggersVariables.forEach((triggerVariables, index) => {
      triggerVariables.forEach(triggerVariable => {
        if (triggerVariable.ready && variableReady === null) {
          variableReady = true;
        }
        if (!triggerVariable.ready) {
          variableReady = false;
        }
        // we create a "variablesKey" string to quickly compare the variables displayed
        // instead of having to loop through 2 arrays. It's quicker :)
        variablesKey += `trigger.${index}.${triggerVariable.name}.${triggerVariable.label}.${triggerVariable.ready}`;
        variableWhileList.push({
          id: `triggerEvent.${triggerVariable.name}`,
          text: `${index + 1}. ${triggerVariable.label}`,
          title: `${index + 1}. ${triggerVariable.label}`,
          value: `triggerEvent.${triggerVariable.name}`
        });
      });
    });
    const previousVariablesKey = this.state.variablesKey;
    await this.setState({ variableWhileList, variableReady, variablesKey });
    // we compare here the previous variables key
    // and the new one, and we compare if they are the same
    if (variablesKey !== previousVariablesKey) {
      this.initTagify();
    }
  };
  setRef = dom => (this.tagifyInputRef = dom);
  initTagify = () => {
    if (this.tagify) {
      this.tagify.destroy();
    }
    this.tagify = new Tagify(this.tagifyInputRef, {
      mode: 'mix',
      pattern: new RegExp(OPENING_VARIABLE),
      duplicates: true,
      enforceWhitelist: true,
      tagTextProp: 'text',
      dropdown: {
        enabled: 1,
        position: 'text',
        mapValueTo: 'title',
        maxItems: 200
      },
      whitelist: this.state.variableWhileList,
      mixTagsInterpolator: [OPENING_VARIABLE, CLOSING_VARIABLE]
    });
    const text = this.props.action.text || '';
    this.tagify.loadOriginalValues(text);
    this.tagify.on('input add remove change', e => {
      const text = get(this.tagify, 'DOM.input.innerText', '');
      this.parseText(text);
    });
  };
  parseText = textContent => {
    let text = textContent ? textContent : '';
    this.state.variableWhileList.forEach(variable => {
      text = text.replaceAll(variable.text, `${OPENING_VARIABLE}${variable.id}${CLOSING_VARIABLE}`);
    });
    text = text.replaceAll(`\n${OPENING_VARIABLE}`, OPENING_VARIABLE);
    text = text.replaceAll(`${CLOSING_VARIABLE}\n`, CLOSING_VARIABLE);
    text = text.trim();
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'text', text);
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      selectedOption: '',
      variableWhileList: []
    };
  }
  componentDidMount() {
    this.getOptions();
    this.initTagify();
  }
  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
    this.refreshVariables(nextProps);
  }
  componentWillUnmount() {
    if (this.tagify) {
      this.tagify.destroy();
    }
  }
  render(props, { selectedOption, userOptions, variableWhileList, variableReady }) {
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
            styles={{
              // Fixes the overlapping problem of the component
              menu: provided => ({ ...provided, zIndex: 2 })
            }}
            options={userOptions}
            value={selectedOption}
            onChange={this.handleChange}
          />
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.messageSend.textLabel" />{' '}
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <div style={helpTextStyle}>
            <Text id="editScene.actionsCard.messageSend.explanationText" />
          </div>
          <div className="tags-input">
            <textarea ref={this.setRef} class="form-control" />
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(SendMessageParams);
