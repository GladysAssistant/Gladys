import Select from '../../../../components/form/Select';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';

import TextWithVariablesInjected from '../../../../components/scene/TextWithVariablesInjected';
import GladysPlusUpsell from '../../../../components/gateway/GladysPlusUpsell';
import style from './PlayNotification.css';

// The position the browser gives an untouched 0-100 range: the fill has to sit where
// the thumb sits, even while the action carries no volume yet
const DEFAULT_RANGE_POSITION = 50;

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
  // A range input only fires `change` when the pointer is released: the fill and the
  // value pill follow the drag through a local draft, the action is updated on release
  updateVolumeDraft = e => {
    this.setState({ volumeDraft: e.target.value });
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
      selectedDeviceFeatureOption: ''
    };
  }
  componentDidMount() {
    this.getOptions();
  }
  componentWillReceiveProps(nextProps) {
    // The committed volume is authoritative again as soon as it moves, whether the
    // change comes from the drag that just ended or from the editor itself
    if (nextProps.action.volume !== this.props.action.volume) {
      this.setState({ volumeDraft: undefined });
    }
    this.refreshSelectedOptions(nextProps);
  }
  render(props, { selectedDeviceFeatureOption, devicesOptions, volumeDraft }) {
    const volume = volumeDraft !== undefined ? volumeDraft : props.action.volume;
    const volumeIsSet = volume !== undefined && volume !== null && volume !== '';
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
          <label class={cx('form-label', style.volumeLabel)}>
            <span>
              <Text id="editScene.actionsCard.playNotification.volumeLabel" />
              <span class="form-required">
                <Text id="global.requiredField" />
              </span>
            </span>
            {volumeIsSet && <span class={style.volumeValue}>{`${volume}%`}</span>}
          </label>
          <input
            type="range"
            value={volume}
            onInput={this.updateVolumeDraft}
            onChange={this.updateVolume}
            class={style.volumeRange}
            style={{ '--volume-fill': `${volumeIsSet ? volume : DEFAULT_RANGE_POSITION}%` }}
            step="1"
            min={0}
            max={100}
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

export default connect('httpClient', {})(PlayNotification);
