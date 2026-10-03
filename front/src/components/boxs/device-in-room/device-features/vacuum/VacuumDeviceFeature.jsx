import { Component, Fragment } from 'preact';
import cx from 'classnames';
import get from 'get-value';

import { VACUUM_CLEANER_MODE } from '../../../../../../../server/utils/constants';
import {
  getVacuumName,
  getVacuumRowFeatures,
  getVacuumStateColor,
  getVacuumStateText,
  isVacuumCleaning
} from './vacuumFeatures';
import VacuumControlPanel from './VacuumControlPanel';
// The row shares the chrome of the light row (summary line, round panel button): every grouped row
// of the devices widget reads the same way.
import lightStyle from '../light/style.css';
import style from './style.css';

/**
 * One row for a whole robot vacuum: its live state and battery, the start / stop and dock buttons
 * people use every day, and the panel holding everything else the widget shows for that robot —
 * clean mode, settings, maintenance — with the regular controls of each feature.
 */
class VacuumDeviceFeature extends Component {
  state = { panelOpened: false };

  openPanel = () => this.setState({ panelOpened: true });

  closePanel = () => this.setState({ panelOpened: false });

  openPanelFromButton = event => {
    event.stopPropagation();
    this.openPanel();
  };

  toggleCleaning = event => {
    event.stopPropagation();
    const rowFeatures = getVacuumRowFeatures(this.props.entries.map(entry => entry.deviceFeature));
    this.props.updateValue(
      rowFeatures.runMode,
      isVacuumCleaning(rowFeatures) ? VACUUM_CLEANER_MODE.IDLE : VACUUM_CLEANER_MODE.CLEANING
    );
  };

  dock = event => {
    event.stopPropagation();
    const { dock } = getVacuumRowFeatures(this.props.entries.map(entry => entry.deviceFeature));
    this.props.updateValue(dock, 1);
  };

  render(props, { panelOpened }) {
    const { device, entries, intl } = props;
    const { dictionary } = intl;
    const features = entries.map(entry => entry.deviceFeature);
    const rowFeatures = getVacuumRowFeatures(features);
    const cleaning = isVacuumCleaning(rowFeatures);
    const stateText = getVacuumStateText(dictionary, rowFeatures);
    const stateColor = getVacuumStateColor(rowFeatures.state);
    const battery = rowFeatures.battery;
    const hasBattery = battery && Number.isFinite(battery.last_value);

    return (
      <Fragment>
        <tr class={cx('device-row-tappable', lightStyle.lightRow)} onClick={this.openPanel}>
          <td>
            <i
              class={cx('fe', 'fe-disc', { [style.rowStateIcon]: stateColor })}
              style={stateColor ? { color: stateColor } : undefined}
            />
          </td>
          <td>
            <div>{getVacuumName(dictionary, device, features)}</div>
            {(stateText || hasBattery) && (
              <div class={lightStyle.rowSummary}>
                {stateText}
                {stateText && hasBattery && ' · '}
                {hasBattery && `${battery.last_value}%`}
              </div>
            )}
          </td>
          <td class="text-right">
            <div class={lightStyle.rowControls}>
              {rowFeatures.runMode && (
                <button
                  type="button"
                  class={cx(lightStyle.openPanelButton, { [style.rowButtonActive]: cleaning })}
                  onClick={this.toggleCleaning}
                  aria-label={get(dictionary, cleaning ? 'vacuumControl.stop' : 'vacuumControl.start')}
                  title={get(dictionary, cleaning ? 'vacuumControl.stop' : 'vacuumControl.start')}
                >
                  <i class={cx('fe', cleaning ? 'fe-square' : 'fe-play')} />
                </button>
              )}
              {rowFeatures.dock && (
                <button
                  type="button"
                  class={lightStyle.openPanelButton}
                  onClick={this.dock}
                  aria-label={get(dictionary, 'vacuumControl.dock')}
                  title={get(dictionary, 'vacuumControl.dock')}
                >
                  <i class="fe fe-home" />
                </button>
              )}
              <button
                type="button"
                class={lightStyle.openPanelButton}
                onClick={this.openPanelFromButton}
                aria-label={get(dictionary, 'vacuumControl.openPanel')}
              >
                <i class="fe fe-chevron-right" />
              </button>
            </div>
          </td>
        </tr>
        {panelOpened && (
          <VacuumControlPanel
            user={props.user}
            x={props.x}
            y={props.y}
            roomIndex={props.roomIndex}
            device={device}
            entries={entries}
            updateValue={props.updateValue}
            updateValueWithDebounce={props.updateValueWithDebounce}
            intl={intl}
            onClose={this.closePanel}
          />
        )}
      </Fragment>
    );
  }
}

export default VacuumDeviceFeature;
