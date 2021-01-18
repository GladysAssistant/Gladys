import Select from 'react-select';
import Tagify from '@yaireo/tagify';
import '@yaireo/tagify/dist/tagify.css';
import { Component } from 'preact';
import get from 'get-value';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

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
    } catch (e) {
      console.log(e);
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
    // if variables didn't change, it's useless to refresh the state
    if (nextProps.variables === this.props.variables) {
      return null;
    }
    const variableWhileList = [];
    let variableReady = null;
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
    await this.setState({ variableWhileList, variableReady });
    if (variableReady) {
      this.initTagify();
    }
  };
  setRef = dom => (this.tagifyInputRef = dom);
  initTagify = () => {
    if (this.tagify) {
      this.tagify.settings.whitelist.length = 0;
      this.tagify.settings.whitelist.push(...this.state.variableWhileList);
      return null;
    }
    this.tagify = new Tagify(this.tagifyInputRef, {
      mode: 'mix',
      pattern: /{{/,
      duplicates: true,
      enforceWhitelist: true,
      tagTextProp: 'text',
      dropdown: {
        enabled: 1,
        position: 'text',
        mapValueTo: 'title'
      },
      whitelist: this.state.variableWhileList,
      mixTagsInterpolator: ['{{', '}}']
    });
    if (this.props.action.text.search('{{') !== -1 && this.props.action.text.search('}}') !== -1) {
      const textFormatted = this.props.action.text.replaceAll('{{', '[[').replaceAll('}}', ']]');
      this.tagify.loadOriginalValues(textFormatted);
    } else {
      this.tagify.loadOriginalValues(this.props.action.text);
    }
    this.tagify.on('input add remove change', e => {
      const text = get(this.tagify, 'DOM.input.innerText', '');
      this.parseText(text);
    });
  };
  parseText = textContent => {
    let text = textContent ? textContent : '';
    this.state.variableWhileList.forEach(variable => {
      text = text.replaceAll(variable.text, `{{${variable.id}}}`);
    });
    text = text.replaceAll('\n{{', '{{');
    text = text.replaceAll('}}\n', '}}');
    text = text.trim();
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'text', text);
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
    this.refreshVariables(nextProps);
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
          <Select options={userOptions} value={selectedOption} onChange={this.handleChange} />
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.messageSend.textLabel" />{' '}
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <div className="tags-input">
            <textarea ref={this.setRef} class="form-control" />
          </div>
        </div>
      </div>
    );
  }
}

export default SendMessageParams;
