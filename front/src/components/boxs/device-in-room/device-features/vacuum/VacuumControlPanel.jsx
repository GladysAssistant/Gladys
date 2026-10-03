import { Component } from 'preact';
import { createPortal } from 'preact/compat';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import { VACUUM_CLEANER_MODE } from '../../../../../../../server/utils/constants';
import DeviceRow from '../../DeviceRow';
import {
  getVacuumName,
  getVacuumPanelLabel,
  getVacuumRowFeatures,
  getVacuumStateColor,
  getVacuumStateText,
  isVacuumCleaning
} from './vacuumFeatures';
// The sheet is the one of the light panel: every panel of the devices widget opens, sits and closes
// the same way, on a phone as on a wall tablet.
import lightStyle from '../light/style.css';
import style from './style.css';

/**
 * The robot vacuum panel: a bottom sheet on a phone, a centered dialog on a tablet or a desktop.
 * It shows the state and battery of the robot, its start / stop and dock buttons sized for a
 * finger, then every other feature the widget shows for that robot — clean mode, settings,
 * maintenance — each with its regular control, so nothing has to be learnt again.
 */
class VacuumControlPanel extends Component {
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

  rowFeatures = () => getVacuumRowFeatures(this.props.entries.map(entry => entry.deviceFeature));

  toggleCleaning = () => {
    const rowFeatures = this.rowFeatures();
    this.props.updateValue(
      rowFeatures.runMode,
      isVacuumCleaning(rowFeatures) ? VACUUM_CLEANER_MODE.IDLE : VACUUM_CLEANER_MODE.CLEANING
    );
  };

  dock = () => this.props.updateValue(this.rowFeatures().dock, 1);

  render({ device, entries, onClose, intl, ...props }) {
    const { dictionary } = intl;
    const features = entries.map(entry => entry.deviceFeature);
    const rowFeatures = getVacuumRowFeatures(features);
    const cleaning = isVacuumCleaning(rowFeatures);
    const name = getVacuumName(dictionary, device, features);
    const stateText = getVacuumStateText(dictionary, rowFeatures);
    const stateColor = getVacuumStateColor(rowFeatures.state);
    const { battery } = rowFeatures;
    const hasBattery = battery && Number.isFinite(battery.last_value);
    // What the head of the panel already shows is not repeated below it.
    const shownAbove = [rowFeatures.state, rowFeatures.runMode, rowFeatures.dock, battery].filter(Boolean);
    const otherEntries = entries.filter(entry => !shownAbove.includes(entry.deviceFeature));

    // The panel is rendered on <body>: the widget cards carry backdrop filters, which would turn a
    // fixed overlay nested inside them into a box clipped to the card.
    return createPortal(
      <div class={cx('glass-theme', lightStyle.overlay)} onClick={this.handleOverlayClick}>
        <div
          class={lightStyle.sheet}
          role="dialog"
          aria-modal="true"
          aria-label={name}
          tabIndex="-1"
          ref={this.setSheetRef}
        >
          <div class={lightStyle.sheetHandle} />
          <div class={lightStyle.header}>
            <div class={lightStyle.headerTitles}>
              <span class={lightStyle.title}>{name}</span>
              {stateText && <span class={lightStyle.subtitle}>{stateText}</span>}
            </div>
            <button
              type="button"
              class={lightStyle.closeButton}
              onClick={onClose}
              aria-label={get(dictionary, 'vacuumControl.close')}
            >
              <i class="fe fe-x" />
            </button>
          </div>

          <div class={style.status}>
            <i
              class={cx('fe', 'fe-disc', style.statusIcon, { [style.rowStateIcon]: stateColor })}
              style={stateColor ? { color: stateColor } : undefined}
            />
            {hasBattery && (
              <div class={style.statusBattery}>
                <span class={style.statusValue}>{`${battery.last_value}%`}</span>
                <span class={style.statusLabel}>
                  <Text id="vacuumControl.battery" />
                </span>
              </div>
            )}
          </div>

          {(rowFeatures.runMode || rowFeatures.dock) && (
            <div class={style.actions}>
              {rowFeatures.runMode && (
                <button
                  type="button"
                  class={cx(lightStyle.powerButton, { [style.actionActive]: cleaning })}
                  onClick={this.toggleCleaning}
                >
                  <i class={cx('fe', cleaning ? 'fe-square' : 'fe-play')} />
                  <Text id={cleaning ? 'vacuumControl.stop' : 'vacuumControl.start'} />
                </button>
              )}
              {rowFeatures.dock && (
                <button type="button" class={lightStyle.powerButton} onClick={this.dock}>
                  <i class="fe fe-home" />
                  <Text id="vacuumControl.dock" />
                </button>
              )}
            </div>
          )}

          {otherEntries.length > 0 && (
            <table class={cx('table card-table table-vcenter device-list-table device-widget-table', style.features)}>
              <tbody>
                {otherEntries.map(entry => (
                  <DeviceRow
                    key={`vacuum-feature-${entry.index}`}
                    user={props.user}
                    x={props.x}
                    y={props.y}
                    device={device}
                    deviceFeature={entry.deviceFeature}
                    roomIndex={props.roomIndex}
                    deviceFeatureIndex={entry.index}
                    rowName={getVacuumPanelLabel(dictionary, device, entry.deviceFeature)}
                    updateValue={props.updateValue}
                    updateValueWithDebounce={props.updateValueWithDebounce}
                    intl={intl}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>,
      document.body
    );
  }
}

export default VacuumControlPanel;
