import Select from 'react-select';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import withIntlAsProp from '../../../../utils/withIntlAsProp';

import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';

import TextWithVariablesInjected from '../../../../components/scene/TextWithVariablesInjected';
import GladysPlusUpsell from '../../../../components/gateway/GladysPlusUpsell';

class PlayNotification extends Component {
  getOptions = async () => {
    try {
      const devices = await this.props.httpClient.get('/api/v1/device', {
        device_feature_category: DEVICE_FEATURE_CATEGORIES.MUSIC,
        device_feature_type: DEVICE_FEATURE_TYPES.MUSIC.PLAY_NOTIFICATION
      });
      const devicesOptions = devices.map(device => ({
        value: device.selector,
        label: device.name
      }));
      const voicesOptions = ['gplus', 'gradium'].map(service => ({
        value: service,
        label: this.props.intl.dictionary.editScene.actionsCard.playNotification.ttsService[service]
      }));
      await this.setState({ devicesOptions, voicesOptions });
      this.refreshSelectedOptions(this.props);
      return devicesOptions;
    } catch (e) {
      console.error(e);
    }
  };
  updateVolume = e => {
    this.props.updateActionProperty(this.props.path, 'volume', e.target.value);
  };
  updateText = text => {
    this.props.updateActionProperty(this.props.path, 'text', text);
  };
  handleDeviceChange = selectedOption => {
    if (selectedOption && selectedOption.value) {
      this.props.updateActionProperty(this.props.path, 'device', selectedOption.value);
    } else {
      this.props.updateActionProperty(this.props.path, 'device', null);
    }
  };
  handleVoiceChange = selectedOption => {
    if (selectedOption && selectedOption.value) {
      this.props.updateActionProperty(this.props.path, 'tts', selectedOption.value);
    } else {
      this.props.updateActionProperty(this.props.path, 'tts', null);
    }
  };

  refreshSelectedOptions = nextProps => {
    let selectedDeviceFeatureOption = '';
    if (nextProps.action.device && this.state.devicesOptions) {
      const deviceFeatureOption = this.state.devicesOptions.find(option => option.value === nextProps.action.device);

      if (deviceFeatureOption) {
        selectedDeviceFeatureOption = deviceFeatureOption;
      }
    }
    let selectedVoiceOption = this.state.voicesOptions
      ? this.state.voicesOptions.find(option => option.value === 'gplus')
      : '';
    if (nextProps.action.tts && this.state.voicesOptions) {
      const voiceOption = this.state.voicesOptions.find(option => option.value === nextProps.action.tts);

      if (voiceOption) {
        selectedVoiceOption = voiceOption;
      }
    }
    this.setState({ selectedDeviceFeatureOption, selectedVoiceOption });
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      selectedDeviceFeatureOption: ''
    };
  }
  componentDidMount() {
    this.getOptions();
  }
  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }
  render(props, { selectedDeviceFeatureOption, devicesOptions, selectedVoiceOption, voicesOptions }) {
    return (
      <div>
        <GladysPlusUpsell
          compact
          icon="fe-volume-2"
          utmCampaign="scene_action_tts"
          titleKey="gladysPlusUpsell.tts.title"
          descriptionKey="gladysPlusUpsell.tts.compactDescription"
        />
        <p>
          <Text id="editScene.actionsCard.playNotification.description" />
        </p>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.playNotification.deviceLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Select
            styles={{
              // Fixes the overlapping problem of the component
              menu: provided => ({ ...provided, zIndex: 2 })
            }}
            options={devicesOptions}
            value={selectedDeviceFeatureOption}
            onChange={this.handleDeviceChange}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.playNotification.volumeLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <input type="text" class="form-control" value={props.action.volume} disabled />
          <input
            type="range"
            value={props.action.volume}
            onChange={this.updateVolume}
            class="form-control custom-range"
            step="1"
            min={0}
            max={100}
          />
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.playNotification.voiceLabel" />
          </label>
          <Select
            options={voicesOptions}
            value={selectedVoiceOption}
            onChange={this.handleVoiceChange}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.playNotification.textLabel" />{' '}
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <div class="mb-1 small">
            <Text id="editScene.actionsCard.playNotification.variablesExplanation" />
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

export default withIntlAsProp(connect('httpClient', {})(PlayNotification));
