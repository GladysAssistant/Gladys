import { Component, Fragment } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import { DEVICE_FEATURE_TYPES } from '../../../../../../../server/utils/constants';
import { getLightFeature, getLightCssColor, valueToPercent } from './lightFeatures';
import LightControlPanel from './LightControlPanel';
import style from './style.css';

/**
 * One row for a whole light: it shows the live state (on/off, brightness, current color) and opens
 * the light panel, where brightness, color and color temperature get controls sized for a finger.
 * The on/off switch stays on the row, so turning a lamp on is still one tap.
 */
class LightDeviceFeature extends Component {
  state = { panelOpened: false };

  openPanel = () => this.setState({ panelOpened: true });

  closePanel = () => this.setState({ panelOpened: false });

  openPanelFromButton = event => {
    event.stopPropagation();
    this.openPanel();
  };

  stopPropagation = event => event.stopPropagation();

  togglePower = () => {
    const binaryFeature = getLightFeature(this.props.features, DEVICE_FEATURE_TYPES.LIGHT.BINARY);
    this.props.updateValue(binaryFeature, binaryFeature.last_value === 1 ? 0 : 1);
  };

  render({ device, features, x, y, updateValue, updateValueWithDebounce, intl }, { panelOpened }) {
    const { dictionary } = intl;
    const binaryFeature = getLightFeature(features, DEVICE_FEATURE_TYPES.LIGHT.BINARY);
    const brightnessFeature = getLightFeature(features, DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS);
    const isOn = binaryFeature ? binaryFeature.last_value === 1 : undefined;
    const lightColor = getLightCssColor(features);
    const brightnessPercent = brightnessFeature
      ? valueToPercent(brightnessFeature, brightnessFeature.last_value)
      : undefined;
    // A light that is off shows no color: the row is a live picture of the lamp.
    const iconColor = isOn === false ? undefined : lightColor;

    return (
      <Fragment>
        <tr class={cx('device-row-tappable', style.lightRow)} onClick={this.openPanel}>
          <td>
            <i
              class={cx('fe', 'fe-sun', { [style.rowLightIcon]: iconColor })}
              style={iconColor ? { color: iconColor } : undefined}
            />
          </td>
          <td>
            <div>{device.name}</div>
            <div class={style.rowSummary}>
              {binaryFeature && <Text id={isOn ? 'lightControl.on' : 'lightControl.off'} />}
              {binaryFeature && brightnessFeature && isOn && ' · '}
              {brightnessFeature && (!binaryFeature || isOn) && `${brightnessPercent}%`}
              {!binaryFeature && !brightnessFeature && <Text id="lightControl.color" />}
            </div>
          </td>
          <td class="text-right">
            <div class={style.rowControls}>
              {binaryFeature && (
                <label class="custom-switch m-0" onClick={this.stopPropagation}>
                  <input
                    type="radio"
                    name={`light-${x}-${y}-${binaryFeature.id}`}
                    value="1"
                    class="custom-switch-input"
                    checked={isOn}
                    onClick={this.togglePower}
                  />
                  <span class="custom-switch-indicator" />
                </label>
              )}
              <button
                type="button"
                class={style.openPanelButton}
                onClick={this.openPanelFromButton}
                aria-label={get(dictionary, 'lightControl.openPanel')}
              >
                <i class="fe fe-chevron-right" />
              </button>
            </div>
          </td>
        </tr>
        {panelOpened && (
          <LightControlPanel
            device={device}
            features={features}
            updateValue={updateValue}
            updateValueWithDebounce={updateValueWithDebounce}
            intl={intl}
            onClose={this.closePanel}
          />
        )}
      </Fragment>
    );
  }
}

export default LightDeviceFeature;
