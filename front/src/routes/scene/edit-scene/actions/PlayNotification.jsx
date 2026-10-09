import Select from '../../../../components/form/Select';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';

import TextWithVariablesInjected from '../../../../components/scene/TextWithVariablesInjected';
import GladysPlusUpsell from '../../../../components/gateway/GladysPlusUpsell';
import style from './PlayNotification.css';
// The Simple/Computed selector is the one already used by the other actions.
import valueTypeStyle from './DeviceSetValue.css';

// The volume the slider falls back to when leaving the computed mode without a usable
// number: the midpoint of the slider.
const DEFAULT_VOLUME = 50;

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
  // Switching the volume type clears the value of the other type, so the action never keeps both
  // a "volume" and an "evaluate_volume": the server evaluates the formula as soon as it is there,
  // and the fixed volume would be silently ignored.
  selectVolumeType = computedVolume => {
    if (computedVolume === this.state.computedVolume) {
      return;
    }
    this.setState({ computedVolume });
    if (computedVolume) {
      // The formula starts from the volume currently selected, so switching to computed does not
      // lose the value shown by the slider.
      const { volume } = this.props.action;
      const evaluateVolume = volume !== undefined && volume !== null && volume !== '' ? `${volume}` : undefined;
      this.props.updateActionProperty(this.props.path, 'evaluate_volume', evaluateVolume);
      this.props.updateActionProperty(this.props.path, 'volume', undefined);
    } else {
      // Coming back to the fixed volume restores a number: the formula is dropped, and leaving
      // "volume" undefined would save an action with no volume at all. A formula that is already
      // a plain number is kept, others fall back to the midpoint of the slider.
      const formula = `${this.props.action.evaluate_volume || ''}`.trim();
      const parsedVolume = Number(formula);
      const volume =
        formula.length > 0 && Number.isFinite(parsedVolume)
          ? Math.min(100, Math.max(0, Math.round(parsedVolume)))
          : DEFAULT_VOLUME;
      this.props.updateActionProperty(this.props.path, 'volume', volume);
      this.props.updateActionProperty(this.props.path, 'evaluate_volume', undefined);
    }
  };

  selectSimpleType = () => this.selectVolumeType(false);

  selectComputedType = () => this.selectVolumeType(true);

  // A range input only fires `change` when the pointer is released: the fill and the
  // value pill follow the drag through a local draft, the action is updated on release
  updateVolumeDraft = e => {
    this.setState({ volumeDraft: e.target.value });
  };
  updateVolume = e => {
    this.props.updateActionProperty(this.props.path, 'volume', parseInt(e.target.value, 10));
    this.props.updateActionProperty(this.props.path, 'evaluate_volume', undefined);
  };
  updateEvaluateVolume = text => {
    this.props.updateActionProperty(this.props.path, 'volume', undefined);
    this.props.updateActionProperty(this.props.path, 'evaluate_volume', text.length > 0 ? text : undefined);
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
    // The committed volume is authoritative again as soon as it moves, whether the
    // change comes from the drag that just ended or from the editor itself
    if (nextProps.action.volume !== this.props.action.volume) {
      this.setState({ volumeDraft: undefined });
    }
    this.refreshSelectedOptions(nextProps);
  }
  getVolumeInput = (volume, volumeIsSet) => {
    if (this.state.computedVolume) {
      return (
        <div>
          <div className={valueTypeStyle.explanationText}>
            <Text id="editScene.actionsCard.playNotification.computedExplanationText" />
          </div>
          <div class="input-group">
            <TextWithVariablesInjected
              text={this.props.action.evaluate_volume || ''}
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
      /* No accent fill until a volume is actually committed: the action still saves
         `volume: undefined` until the slider is touched, and each speaker then applies
         its own default, so a half-filled track would read as a 50% that is never sent. */
      <input
        type="range"
        value={volume}
        onInput={this.updateVolumeDraft}
        onChange={this.updateVolume}
        class={style.volumeRange}
        style={{ '--volume-fill': `${volumeIsSet ? volume : 0}%` }}
        step="1"
        min={0}
        max={100}
      />
    );
  };

  render(props, { selectedDeviceFeatureOption, devicesOptions, volumeDraft, computedVolume }) {
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
            {/* The pill reads the slider: in computed mode the volume is only known at runtime. */}
            {!computedVolume && volumeIsSet && <span class={style.volumeValue}>{`${volume}%`}</span>}
          </label>
          <div className={cx('nav-tabs', valueTypeStyle.valueTypeTab)}>
            <button
              type="button"
              class={cx('nav-link', valueTypeStyle.valueTypeLink, { active: !computedVolume })}
              onClick={this.selectSimpleType}
            >
              <Text id="editScene.actionsCard.playNotification.valueTypeSimple" />
            </button>
            <button
              type="button"
              class={cx('nav-link', valueTypeStyle.valueTypeLink, { active: computedVolume })}
              onClick={this.selectComputedType}
            >
              <Text id="editScene.actionsCard.playNotification.valueTypeComputed" />
            </button>
          </div>
          {this.getVolumeInput(volume, volumeIsSet)}
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
