import Select from 'react-select';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

import TextWithVariablesInjected from '../../../../components/scene/TextWithVariablesInjected';

class SendMessageCameraParams extends Component {
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

      const cameras = await this.props.httpClient.get('/api/v1/camera');
      const cameraOptions = cameras.map(camera => ({
        label: camera.name,
        value: camera.selector
      }));

      await this.setState({ userOptions, cameraOptions });
      this.refreshSelectedOptions(this.props);
      return userOptions;
    } catch (e) {
      console.error(e);
    }
  };
  updateText = text => {
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'text', text);
  };
  handleUserChange = selectedOption => {
    if (selectedOption && selectedOption.value) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'user', selectedOption.value);
    } else {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'user', null);
    }
  };
  handleCameraChange = selectedOption => {
    if (selectedOption && selectedOption.value) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'camera', selectedOption.value);
    } else {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'camera', null);
    }
  };

  refreshSelectedOptions = nextProps => {
    let selectedUserOption = '';
    if (nextProps.action.user && this.state.userOptions) {
      const userOption = this.state.userOptions.find(option => option.value === nextProps.action.user);

      if (userOption) {
        selectedUserOption = userOption;
      }
    }
    let selectedCameraOption = '';
    if (nextProps.action.camera && this.state.cameraOptions) {
      const cameraOption = this.state.cameraOptions.find(option => option.value === nextProps.action.camera);

      if (cameraOption) {
        selectedCameraOption = cameraOption;
      }
    }
    this.setState({ selectedUserOption, selectedCameraOption });
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
  render(props, { selectedUserOption, userOptions, selectedCameraOption, cameraOptions }) {
    return (
      <div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.messageCameraSend.userLabel" />
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
          />
        </div>
        <div class="form-group">
          <label className="form-label">
            <Text id="editScene.actionsCard.messageCameraSend.cameraLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Select
            styles={{
              // Fixes the overlapping problem of the component
              menu: provided => ({ ...provided, zIndex: 2 })
            }}
            options={cameraOptions}
            value={selectedCameraOption}
            onChange={this.handleCameraChange}
          />
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.messageCameraSend.textLabel" />{' '}
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <div class="mb-1 small">
            <Text id="editScene.actionsCard.messageCameraSend.explanationText" />
          </div>
          <div className="tags-input">
            <TextWithVariablesInjected
              text={props.action.text}
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

export default connect('httpClient', {})(SendMessageCameraParams);
