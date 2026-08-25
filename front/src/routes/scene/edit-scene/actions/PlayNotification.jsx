import Select from 'react-select';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';

import TextWithVariablesInjected from '../../../../components/scene/TextWithVariablesInjected';
import GladysPlusUpsell from '../../../../components/gateway/GladysPlusUpsell';
import style from './DeviceSetValue.css';

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

      await this.setState({ devicesOptions });
      this.refreshSelectedOptions(this.props);
      return devicesOptions;
    } catch (e) {
      console.error(e);
    }
  };
  toggleVolumeType = () => this.setState({ computedVolume: !this.state.computedVolume });
  updateVolume = e => {
    this.props.updateActionProperty(this.props.path, 'volume', parseInt(e.target.value, 10));
    this.props.updateActionProperty(this.props.path, 'evaluate_volume', undefined);
  };
  updateEvaluateVolume = text => {
    this.props.updateActionProperty(this.props.path, 'volume', undefined);
    this.props.updateActionProperty(this.props.path, 'evaluate_volume', text);
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

  refreshSelectedOptions = nextProps => {
    let selectedDeviceFeatureOption = '';
    if (nextProps.action.device && this.state.devicesOptions) {
      const deviceFeatureOption = this.state.devicesOptions.find(option => option.value === nextProps.action.device);

      if (deviceFeatureOption) {
        selectedDeviceFeatureOption = deviceFeatureOption;
      }
    }
    this.setState({ selectedDeviceFeatureOption });
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      selectedDeviceFeatureOption: '',
      computedVolume: props.action.evaluate_volume !== undefined
    };
  }
  componentDidMount() {
    this.getOptions();
  }
  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }
  getVolumeInput = () => {
    if (this.state.computedVolume) {
      return (
        <div>
          <div className={style.explanationText}>
            <Text id="editScene.actionsCard.playNotification.computedExplanationText" />
          </div>
          <div class="input-group">
            <TextWithVariablesInjected
              text={
                this.props.action.volume !== undefined
                  ? Number(this.props.action.volume).toString()
                  : this.props.action.evaluate_volume
              }
              path={this.props.path}
              triggersVariables={this.props.triggersVariables}
              actionsGroupsBefore={this.props.actionsGroupsBefore}
              variables={this.props.variables}
              updateText={this.updateEvaluateVolume}
            />
          </div>
        </div>
      );
    }

    return (
      <div>
        <input type="text" class="form-control" value={this.props.action.volume} disabled />
        <input
          type="range"
          value={this.props.action.volume}
          onChange={this.updateVolume}
          class="form-control custom-range"
          step="1"
          min={0}
          max={100}
        />
      </div>
    );
  };

  render(props, { selectedDeviceFeatureOption, devicesOptions }) {
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
          <div className={cx('nav-tabs', style.valueTypeTab)}>
            <span
              class={cx('nav-link', style.valueTypeLink, { active: !this.state.computedVolume })}
              onClick={this.toggleVolumeType}
            >
              <Text id="editScene.actionsCard.playNotification.valueTypeSimple" />
            </span>
            <span
              class={cx('nav-link', style.valueTypeLink, { active: this.state.computedVolume })}
              onClick={this.toggleVolumeType}
            >
              <Text id="editScene.actionsCard.playNotification.valueTypeComputed" />
            </span>
          </div>
          {this.getVolumeInput()}
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

export default connect('httpClient', {})(PlayNotification);
