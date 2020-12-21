import Select from 'react-select';
import Tags from '@yaireo/tagify/dist/react.tagify';
import '@yaireo/tagify/dist/tagify.css';
import { Component } from 'preact';
import get from 'get-value';
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
    const variableWhileList = [];

    props.actionsGroupsBefore.forEach((actionGroup, groupIndex) => {
      actionGroup.forEach((action, index) => {
        if (this.props.variables[groupIndex][index]) {
          this.props.variables[groupIndex][index].forEach(option => {
            variableWhileList.push({
              id: `${groupIndex + 1}. ${option.label}`,
              text: `${groupIndex + 1}. ${option.label}`,
              title: `${groupIndex + 1}. ${option.label}`,
              value: `${groupIndex}.${index}.${option.name}`
            });
          });
        }
      });
    });
    console.log(variableWhileList);
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
          <Localizer>
            <textarea
              class="form-control"
              value={props.action.text}
              onChange={this.handleChangeText}
              placeholder={<Text id="editScene.actionsCard.messageSend.textPlaceholder" />}
            />
          </Localizer>
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.messageSend.textLabel" />{' '}
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          {variableWhileList && variableWhileList.length > 0 && (
            <Tags
              InputMode="textarea"
              onChange={console.log}
              onInput={e => console.log(e.detail)}
              settings={{
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
                whitelist: variableWhileList,
                mixTagsInterpolator: ['{{', '}}']
              }}
            />
          )}
        </div>
      </div>
    );
  }
}

export default SendMessageParams;
