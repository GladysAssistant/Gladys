import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { registerAdaptiveControl, scheduleReflow } from './acAdaptiveControls';
import style from './AdaptiveOptionControl.css';

/**
 * Renders a device-feature option control that shows an inline button group when its options fit
 * on a single line, and falls back to a compact dropdown otherwise. The buttons-vs-dropdown
 * decision is coordinated per card (see acAdaptiveControls) so controls sharing the same table
 * column stay consistent and never overflow the card.
 */
// A stable signature of the option set: the buttons-vs-dropdown layout depends on the number of
// options and their rendered labels, so a change in either must re-run the coordinator.
const optionsSignature = options =>
  (Array.isArray(options) ? options : [])
    .map(option => `${option.value}:${option.i18nKey || option.label || ''}`)
    .join('|');

class AdaptiveOptionControl extends Component {
  setCell = element => {
    this.cell = element;
  };

  setButtons = element => {
    this.buttons = element;
  };

  setSelect = element => {
    this.select = element;
    // Hidden by default (buttons first); the coordinator reveals it if the buttons don't fit.
    // Done here rather than via a JSX `style` prop so Preact never manages this element's display
    // and cannot clobber the coordinator's choice on an unrelated re-render (e.g. a value update).
    if (element) {
      element.style.display = 'none';
    }
  };

  setProbe = element => {
    this.probe = element;
  };

  // Handle shared with the per-card coordinator, which toggles the visible control directly on
  // the DOM (synchronously) so it can measure overflow between switches.
  control = {
    mode: 'buttons',
    show: mode => {
      if (!this.buttons || !this.select) {
        return;
      }
      this.control.mode = mode;
      this.buttons.style.display = mode === 'buttons' ? '' : 'none';
      this.select.style.display = mode === 'buttons' ? 'none' : '';
    },
    requiredWidth: () => (this.probe ? this.probe.getBoundingClientRect().width : 0)
  };

  componentDidMount() {
    this.card = this.cell && this.cell.closest('.card');
    this.unregister = registerAdaptiveControl(this.card, this.control);
  }

  componentDidUpdate(prevProps) {
    // The buttons-vs-dropdown choice is taken at mount and on card resize. When the option set
    // itself changes later — e.g. supported_options arriving from a WebSocket update after the
    // first render — re-run the layout so the control does not stay as overflowing buttons or a
    // needless dropdown until the next resize.
    if (this.card && optionsSignature(prevProps.options) !== optionsSignature(this.props.options)) {
      scheduleReflow(this.card);
    }
  }

  componentWillUnmount() {
    if (this.unregister) {
      this.unregister();
    }
  }

  updateFromSelect = e => {
    // The DOM select yields strings: the matching option gives the value back with its
    // real type (number for enum-like features, string for dynamic text selects)
    const selectedOption = this.props.options.find(option => `${option.value}` === e.currentTarget.value);
    this.props.updateValue(selectedOption ? selectedOption.value : Number(e.currentTarget.value));
  };

  renderLabel(option) {
    if (!option.i18nKey) {
      return option.label || String(option.value);
    }
    const { category, type } = this.props;
    return (
      <Text
        id={`deviceFeatureAction.category.${category}.${type}.${option.i18nKey}`}
        default={option.label || String(option.value)}
      />
    );
  }

  render({ options, value }) {
    return (
      <td class="py-0" ref={this.setCell}>
        <div class="d-flex justify-content-end">
          <div class="btn-group" role="group" ref={this.setButtons}>
            {options.map(option => (
              <button
                type="button"
                key={option.value}
                class={cx('btn btn-sm btn-secondary', {
                  // Stringified comparison: a string select state always compares to its
                  // option as text, and numeric states keep matching their numeric options
                  active: value !== null && value !== undefined && `${value}` === `${option.value}`
                })}
                disabled={option.disabled}
                onClick={() => this.props.updateValue(option.value)}
              >
                {this.renderLabel(option)}
              </button>
            ))}
          </div>
          <div class="form-group mb-0" ref={this.setSelect}>
            <select value={value} onChange={this.updateFromSelect} class="form-control form-control-sm">
              {options.map(option => (
                <option value={option.value} key={option.value}>
                  {this.renderLabel(option)}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Hidden probe: natural (single-line) width of the button group, used to pick which
            control collapses first. Absolutely positioned so it never affects the table layout. */}
        <div ref={this.setProbe} aria-hidden="true" class={style.probe}>
          <div class="btn-group">
            {options.map(option => (
              <span class="btn btn-sm btn-secondary" key={option.value}>
                {this.renderLabel(option)}
              </span>
            ))}
          </div>
        </div>
      </td>
    );
  }
}

export default AdaptiveOptionControl;
