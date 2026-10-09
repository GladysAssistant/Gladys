import { Component, Fragment } from 'preact';
import { createPortal } from 'preact/compat';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import { DEVICE_FEATURE_TYPES } from '../../../../../../../server/utils/constants';
import { intToHex } from '../../../../../../../server/utils/colors';
import {
  getCustomFeatureName,
  getLightFeature,
  getLightName,
  getLightCssColor,
  temperatureGradient,
  temperatureValueToKelvin,
  valueToPercent
} from './lightFeatures';
import LightSlider from './LightSlider';
import LightColorWheel from './LightColorWheel';
import style from './style.css';

// One-tap colors, so picking a warm white or a red does not require aiming at the wheel.
const COLOR_PRESETS = [
  0xff3b30,
  0xff9500,
  0xffcc00,
  0x34c759,
  0x30d5c8,
  0x007aff,
  0x5856d6,
  0xaf52de,
  0xff2d55,
  0xfff1dc
];

const TABS = { COLOR: 'color', TEMPERATURE: 'temperature' };

// The color tab holds the wheel and, for the integrations exposing them separately, the hue and
// saturation sliders — any one of the three is enough for the tab to have something to show.
const hasColorFeature = features =>
  Boolean(
    getLightFeature(features, DEVICE_FEATURE_TYPES.LIGHT.COLOR) ||
      getLightFeature(features, DEVICE_FEATURE_TYPES.LIGHT.HUE) ||
      getLightFeature(features, DEVICE_FEATURE_TYPES.LIGHT.SATURATION)
  );

/**
 * The light control panel: a bottom sheet on a phone, a centered dialog on a tablet or a desktop.
 * It gathers every light feature of one device — power, brightness, color, color temperature — into
 * controls sized for a finger, instead of the row-sized inputs of the widget table.
 */
class LightControlPanel extends Component {
  constructor(props) {
    super(props);
    this.state = { tab: hasColorFeature(props.features) ? TABS.COLOR : TABS.TEMPERATURE, previewColor: undefined };
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
    // The sheet covers the screen on a phone: scrolling inside it must not scroll the dashboard
    // underneath.
    this.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (this.sheetRef) {
      this.sheetRef.focus();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.body.style.overflow = this.previousBodyOverflow;
  }

  setSheetRef = element => {
    this.sheetRef = element;
  };

  handleKeyDown = event => {
    if (event.key === 'Escape') {
      this.props.onClose();
    }
  };

  handleOverlayClick = event => {
    // Only a click on the backdrop itself closes the panel, not one bubbling up from a control.
    if (event.target === event.currentTarget) {
      this.props.onClose();
    }
  };

  selectColorTab = () => this.setState({ tab: TABS.COLOR });

  selectTemperatureTab = () => this.setState({ tab: TABS.TEMPERATURE });

  togglePower = () => {
    const binaryFeature = getLightFeature(this.props.features, DEVICE_FEATURE_TYPES.LIGHT.BINARY);
    this.props.updateValue(binaryFeature, binaryFeature.last_value === 1 ? 0 : 1);
  };

  updateFeature = feature => value => this.props.updateValueWithDebounce(feature, value);

  // The wheel paints the panel on every move but only writes to the lamp when the finger leaves it.
  previewColor = color => this.setState({ previewColor: color });

  // A cancelled wheel touch writes nothing: the panel goes back to the color the lamp really has.
  cancelColorPreview = () => this.setState({ previewColor: undefined });

  setColor = colorFeature => color => {
    this.setState({ previewColor: undefined });
    this.props.updateValue(colorFeature, color);
  };

  // A feature the user renamed in the widget editor is labelled with the name they typed, in the
  // panel too — not only on the row.
  featureLabel = (feature, i18nKey) => {
    const customName = getCustomFeatureName(this.props.intl.dictionary, this.props.device, feature);
    return customName || get(this.props.intl.dictionary, i18nKey);
  };

  renderBrightness(brightnessFeature, lightColor, isOff) {
    const percent = valueToPercent(brightnessFeature, brightnessFeature.last_value);
    // The bar is painted with the color the lamp is actually showing, so the panel reads at a
    // glance even before looking at the wheel. A light that is off drops it for the neutral bar
    // of .sliderFillNeutral.
    const fillBackground = isOff
      ? undefined
      : `linear-gradient(to top, ${lightColor || '#ffb648'}, ${lightColor || '#fff0d0'})`;

    return (
      <div class={style.brightnessBlock}>
        <span class={cx(style.brightnessValue, { [style.brightnessValueOff]: isOff })}>{`${percent}%`}</span>
        <LightSlider
          vertical
          min={Number.isFinite(brightnessFeature.min) ? brightnessFeature.min : 0}
          max={Number.isFinite(brightnessFeature.max) ? brightnessFeature.max : 100}
          value={brightnessFeature.last_value}
          onChange={this.updateFeature(brightnessFeature)}
          label={this.featureLabel(brightnessFeature, 'lightControl.brightness')}
          valueText={`${percent}%`}
          fillBackground={fillBackground}
          neutralFill={isOff}
        >
          <i class={cx('fe', 'fe-sun', style.brightnessIcon)} />
        </LightSlider>
      </div>
    );
  }

  renderTemperature(temperatureFeature) {
    const min = Number.isFinite(temperatureFeature.min) ? temperatureFeature.min : 0;
    const max = Number.isFinite(temperatureFeature.max) ? temperatureFeature.max : 100;
    const value = Number.isFinite(temperatureFeature.last_value) ? temperatureFeature.last_value : min;
    // Which end is warm depends on the unit the integration exposes (kelvins go the other way
    // round from mireds), so the end labels are derived from the values themselves.
    const minIsWarm =
      temperatureValueToKelvin(temperatureFeature, min) < temperatureValueToKelvin(temperatureFeature, max);
    const kelvin = Math.round(temperatureValueToKelvin(temperatureFeature, value));

    return (
      <div class={style.tabPanel}>
        <div class={style.controlHeader}>
          <span class={style.controlLabel}>{this.featureLabel(temperatureFeature, 'lightControl.temperature')}</span>
          <span class={style.controlValue}>{`${kelvin} K`}</span>
        </div>
        <LightSlider
          min={min}
          max={max}
          value={value}
          onChange={this.updateFeature(temperatureFeature)}
          label={this.featureLabel(temperatureFeature, 'lightControl.temperature')}
          valueText={`${kelvin} K`}
          trackBackground={temperatureGradient(temperatureFeature)}
        />
        <div class={style.sliderLegend}>
          <span>
            <Text id={minIsWarm ? 'lightControl.warm' : 'lightControl.cold'} />
          </span>
          <span>
            <Text id={minIsWarm ? 'lightControl.cold' : 'lightControl.warm'} />
          </span>
        </div>
      </div>
    );
  }

  renderPercentSlider(feature, labelKey, trackBackground) {
    const min = Number.isFinite(feature.min) ? feature.min : 0;
    const max = Number.isFinite(feature.max) ? feature.max : 100;
    const value = Number.isFinite(feature.last_value) ? feature.last_value : min;

    return (
      <div class={style.tabPanel} key={feature.selector}>
        <div class={style.controlHeader}>
          <span class={style.controlLabel}>{this.featureLabel(feature, labelKey)}</span>
          <span class={style.controlValue}>{value}</span>
        </div>
        <LightSlider
          min={min}
          max={max}
          value={value}
          onChange={this.updateFeature(feature)}
          label={this.featureLabel(feature, labelKey)}
          valueText={`${value}`}
          trackBackground={trackBackground}
        />
      </div>
    );
  }

  renderColorTab(colorFeature, hueFeature, saturationFeature) {
    return (
      <Fragment>
        {colorFeature && (
          <Fragment>
            <LightColorWheel
              value={colorFeature.last_value}
              onPreview={this.previewColor}
              onChange={this.setColor(colorFeature)}
              onCancel={this.cancelColorPreview}
            />
            <div class={style.presets}>
              {COLOR_PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  class={style.presetSwatch}
                  style={{ backgroundColor: `#${intToHex(preset)}` }}
                  aria-label={`#${intToHex(preset)}`}
                  onClick={() => this.setColor(colorFeature)(preset)}
                />
              ))}
            </div>
          </Fragment>
        )}
        {hueFeature &&
          this.renderPercentSlider(
            hueFeature,
            'lightControl.hue',
            'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
          )}
        {saturationFeature && this.renderPercentSlider(saturationFeature, 'lightControl.saturation')}
      </Fragment>
    );
  }

  render({ device, features, onClose, intl }, { tab, previewColor }) {
    const { dictionary } = intl;
    const binaryFeature = getLightFeature(features, DEVICE_FEATURE_TYPES.LIGHT.BINARY);
    const brightnessFeature = getLightFeature(features, DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS);
    const colorFeature = getLightFeature(features, DEVICE_FEATURE_TYPES.LIGHT.COLOR);
    const temperatureFeature = getLightFeature(features, DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE);
    const hueFeature = getLightFeature(features, DEVICE_FEATURE_TYPES.LIGHT.HUE);
    const saturationFeature = getLightFeature(features, DEVICE_FEATURE_TYPES.LIGHT.SATURATION);

    const isOff = binaryFeature ? binaryFeature.last_value !== 1 : false;
    // While a finger drags the wheel the lamp has not been written yet: the panel still shows the
    // color under the finger, so the brightness bar follows the drag.
    const lightColor = Number.isFinite(previewColor) ? `#${intToHex(previewColor)}` : getLightCssColor(features);
    const hasColorTab = hasColorFeature(features);
    const hasTemperatureTab = Boolean(temperatureFeature);
    const currentTab = tab === TABS.COLOR && !hasColorTab ? TABS.TEMPERATURE : tab;

    // The panel is rendered on <body>: the widget cards carry backdrop filters, which would turn a
    // fixed overlay nested inside them into a box clipped to the card.
    return createPortal(
      <div class={cx('glass-theme', style.overlay)} onClick={this.handleOverlayClick}>
        <div
          class={style.sheet}
          role="dialog"
          aria-modal="true"
          aria-label={getLightName(dictionary, device, features)}
          tabIndex="-1"
          ref={this.setSheetRef}
        >
          <div class={style.sheetHandle} />
          <div class={style.header}>
            <div class={style.headerTitles}>
              <span class={style.title}>{getLightName(dictionary, device, features)}</span>
              {binaryFeature && (
                <span class={style.subtitle}>
                  <Text id={isOff ? 'lightControl.off' : 'lightControl.on'} />
                </span>
              )}
            </div>
            <button
              type="button"
              class={style.closeButton}
              onClick={onClose}
              aria-label={get(dictionary, 'lightControl.close')}
            >
              <i class="fe fe-x" />
            </button>
          </div>

          {brightnessFeature && this.renderBrightness(brightnessFeature, lightColor, isOff)}

          {binaryFeature && (
            <button
              type="button"
              class={cx(style.powerButton, { [style.powerButtonOn]: !isOff })}
              onClick={this.togglePower}
            >
              <i class="fe fe-power" />
              <Text id={isOff ? 'lightControl.turnOn' : 'lightControl.turnOff'} />
            </button>
          )}

          {hasColorTab && hasTemperatureTab && (
            <div class={cx('btn-group', 'hz-segmented', 'w-100', style.tabs)} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={currentTab === TABS.COLOR ? 'true' : 'false'}
                class={cx('btn', 'btn-sm', { active: currentTab === TABS.COLOR })}
                onClick={this.selectColorTab}
              >
                <Text id="lightControl.color" />
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={currentTab === TABS.TEMPERATURE ? 'true' : 'false'}
                class={cx('btn', 'btn-sm', { active: currentTab === TABS.TEMPERATURE })}
                onClick={this.selectTemperatureTab}
              >
                <Text id="lightControl.temperature" />
              </button>
            </div>
          )}

          {hasColorTab &&
            (!hasTemperatureTab || currentTab === TABS.COLOR) &&
            this.renderColorTab(colorFeature, hueFeature, saturationFeature)}

          {hasTemperatureTab &&
            (!hasColorTab || currentTab === TABS.TEMPERATURE) &&
            this.renderTemperature(temperatureFeature)}
        </div>
      </div>,
      document.body
    );
  }
}

export default LightControlPanel;
