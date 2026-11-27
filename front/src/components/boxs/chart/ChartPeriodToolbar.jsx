import { Component, createRef } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import style from './style.css';
import { INTERVAL_LABELS, getIntervals, getPeriodLabel } from './chartUtils';

/**
 * @description The period toolbar of a chart: previous / next period around the period menu, with
 * the live dot or, when browsing the past, the range pill that comes back to now. Shared by the
 * card and by its enlarged view: both drive the same period.
 */
class ChartPeriodToolbar extends Component {
  dropdownRef = createRef();

  state = { dropdown: false };

  setDropdown = dropdown => {
    if (dropdown === this.state.dropdown) {
      return;
    }
    this.setState({ dropdown });
    if (this.props.onDropdownChange) {
      this.props.onDropdownChange(dropdown);
    }
  };

  handleClickOutside = event => {
    if (this.dropdownRef.current && !this.dropdownRef.current.contains(event.target)) {
      this.setDropdown(false);
    }
  };

  toggleDropdown = () => this.setDropdown(!this.state.dropdown);

  selectInterval = interval => {
    this.setDropdown(false);
    this.props.onSelectInterval(interval);
  };

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  render({ interval, offset, chartType, language, dictionary, onPrevious, onNext, onBackToNow }, { dropdown }) {
    const labels = dictionary.dashboard.boxes.chart;
    return (
      <div class={style.chartToolbar}>
        <button
          type="button"
          class={style.navButton}
          onClick={onPrevious}
          title={labels.previousPeriod}
          aria-label={labels.previousPeriod}
        >
          <i class="fe fe-chevron-left" />
        </button>

        <div class={style.toolbarBody} ref={this.dropdownRef}>
          <button type="button" class={style.intervalButton} onClick={this.toggleDropdown}>
            <Text id={INTERVAL_LABELS[interval]} />
            <i class={cx('fe fe-chevron-down', style.intervalChevron, { [style.intervalChevronOpen]: dropdown })} />
          </button>

          {/* single line next to the period label: the live dot, or —
              when browsing the past — an accent pill showing the range,
              whose one tap action (the return icon says it) is coming
              back to now */}
          {offset > 0 ? (
            <button
              type="button"
              class={style.periodRangeButton}
              onClick={onBackToNow}
              title={labels.backToNow}
              aria-label={labels.backToNow}
            >
              <i class="fe fe-corner-up-left" />
              <span class={style.periodRange}>{getPeriodLabel(interval, offset, language)}</span>
            </button>
          ) : (
            <div class={style.periodLive}>
              <span class={style.liveDot} />
              <Text id="dashboard.boxes.chart.currentPeriod" />
            </div>
          )}

          <div
            class={cx(style.dropdownMenuChart, {
              [style.dropdownMenuOpen]: dropdown
            })}
          >
            {getIntervals(chartType).map(oneInterval => (
              <button
                type="button"
                key={oneInterval}
                class={cx(style.dropdownItemChart, {
                  [style.active]: interval === oneInterval
                })}
                aria-current={interval === oneInterval ? 'true' : undefined}
                onClick={() => this.selectInterval(oneInterval)}
              >
                <Text id={INTERVAL_LABELS[oneInterval]} />
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          class={style.navButton}
          onClick={onNext}
          disabled={offset === 0}
          title={labels.nextPeriod}
          aria-label={labels.nextPeriod}
        >
          <i class="fe fe-chevron-right" />
        </button>
      </div>
    );
  }
}

export default ChartPeriodToolbar;
