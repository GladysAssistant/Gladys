import { Component } from 'preact';
import { connect } from 'unistore/preact';
import cx from 'classnames';

import { Text } from 'preact-i18n';
import style from './style.css';
import ApexChartComponent from './ApexChartComponent';

const ONE_HOUR_IN_MINUTES = 60;
const ONE_DAY_IN_MINUTES = 24 * 60;
const SEVEN_DAYS_IN_MINUTES = 7 * 24 * 60;
const THIRTY_DAYS_IN_MINUTES = 30 * 24 * 60;
const THREE_MONTHS_IN_MINUTES = 3 * 30 * 24 * 60;

const intervalByName = {
  'last-hour': ONE_HOUR_IN_MINUTES,
  'last-day': ONE_DAY_IN_MINUTES,
  'last-week': SEVEN_DAYS_IN_MINUTES,
  'last-month': THIRTY_DAYS_IN_MINUTES,
  'last-three-months': THREE_MONTHS_IN_MINUTES
};

class Chartbox extends Component {
  toggleDropdown = () => {
    this.setState({
      dropdown: !this.state.dropdown
    });
  };
  switchToLastHourView = async e => {
    e.preventDefault();
    await this.setState({
      interval: ONE_HOUR_IN_MINUTES,
      dropdown: false
    });
    this.getData();
  };
  switchToOneDayView = async e => {
    e.preventDefault();
    await this.setState({
      interval: ONE_DAY_IN_MINUTES,
      dropdown: false
    });
    this.getData();
  };
  switchTo7DaysView = async e => {
    e.preventDefault();
    await this.setState({
      interval: SEVEN_DAYS_IN_MINUTES,
      dropdown: false
    });
    this.getData();
  };
  switchTo30DaysView = async e => {
    await this.setState({
      interval: THIRTY_DAYS_IN_MINUTES,
      dropdown: false
    });
    this.getData();
  };
  switchTo3monthsView = async e => {
    await this.setState({
      interval: THREE_MONTHS_IN_MINUTES,
      dropdown: false
    });
    this.getData();
  };
  getData = async () => {
    await this.setState({ loading: true });
    try {
      const data = await this.props.httpClient.get(
        `/api/v1/device_feature/${this.props.box.device_feature}/aggregated_states`,
        {
          interval: this.state.interval,
          max_states: 100
        }
      );
      const series = [
        {
          name: this.props.box.title,
          data: []
        }
      ];
      const labels = [];
      data.forEach(point => {
        series[0].data.push(point.value);
        labels.push(point.created_at);
      });
      const firstElement = data[0];
      const lastElement = data[data.length - 1];
      const variation = firstElement && lastElement ? Math.round((100 * firstElement.value) / lastElement.value) : null;
      const lastValueRounded = lastElement ? Math.round(lastElement.value) : null;
      await this.setState({
        series,
        labels,
        variation,
        lastValueRounded,
        loading: false
      });
    } catch (e) {
      console.error(e);
    }
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      interval: this.props.box.interval ? intervalByName[this.props.box.interval] : ONE_HOUR_IN_MINUTES,
      loading: true,
      height: 'small'
    };
  }
  componentDidMount() {
    this.getData();
  }
  render(props, { loading, series, labels, dropdown, variation, lastValueRounded, interval }) {
    const smallBox = interval === ONE_HOUR_IN_MINUTES;
    return (
      <div class="card">
        <div class={loading ? 'dimmer active' : 'dimmer'}>
          <div class="loader" />
          <div class="dimmer-content">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div
                  class={cx({
                    [style.subheader]: smallBox,
                    [style.subheaderBig]: !smallBox
                  })}
                >
                  {props.box.title}
                </div>
                <div class={cx(style.msAuto, style.lh1)}>
                  <div class="dropdown">
                    <a class="dropdown-toggle text-muted" onClick={this.toggleDropdown}>
                      {interval === ONE_HOUR_IN_MINUTES && <Text id="dashboard.boxes.chart.lastHour" />}
                      {interval === ONE_DAY_IN_MINUTES && <Text id="dashboard.boxes.chart.lastDay" />}
                      {interval === SEVEN_DAYS_IN_MINUTES && <Text id="dashboard.boxes.chart.lastSevenDays" />}
                      {interval === THIRTY_DAYS_IN_MINUTES && <Text id="dashboard.boxes.chart.lastThirtyDays" />}
                      {interval === THREE_MONTHS_IN_MINUTES && <Text id="dashboard.boxes.chart.lastThreeMonths" />}
                    </a>
                    <div
                      class={cx(style.dropdownMenuChart, {
                        [style.show]: dropdown
                      })}
                    >
                      <a
                        class={cx(style.dropdownItemChart, {
                          [style.active]: interval === ONE_HOUR_IN_MINUTES
                        })}
                        onClick={this.switchToLastHourView}
                      >
                        <Text id="dashboard.boxes.chart.lastHour" />
                      </a>
                      <a
                        class={cx(style.dropdownItemChart, {
                          [style.active]: interval === ONE_DAY_IN_MINUTES
                        })}
                        onClick={this.switchToOneDayView}
                      >
                        <Text id="dashboard.boxes.chart.lastDay" />
                      </a>
                      <a
                        class={cx(style.dropdownItemChart, {
                          [style.active]: interval === SEVEN_DAYS_IN_MINUTES
                        })}
                        onClick={this.switchTo7DaysView}
                      >
                        <Text id="dashboard.boxes.chart.lastSevenDays" />
                      </a>
                      <a
                        class={cx(style.dropdownItemChart, {
                          [style.active]: interval === THIRTY_DAYS_IN_MINUTES
                        })}
                        onClick={this.switchTo30DaysView}
                      >
                        <Text id="dashboard.boxes.chart.lastThirtyDays" />
                      </a>
                      <a
                        class={cx(style.dropdownItemChart, {
                          [style.active]: interval === THREE_MONTHS_IN_MINUTES
                        })}
                        onClick={this.switchTo3monthsView}
                      >
                        <Text id="dashboard.boxes.chart.lastThreeMonths" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              {smallBox && (
                <div class="d-flex align-items-baseline">
                  <div class="h1 mb-0 mr-2">
                    {lastValueRounded}
                    {props.unit}
                  </div>
                  <div
                    class={cx(style.meAuto, {
                      [style.textGreen]: variation > 0,
                      [style.textYellow]: variation === 0,
                      [style.textRed]: variation < 0
                    })}
                  >
                    {labels && labels.length > 0 && (
                      <span class="text-green d-inline-flex align-items-center lh-1">
                        {variation}%
                        {variation > 0 && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class={cx(style.variationIcon)}
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            stroke-width="2"
                            stroke="currentColor"
                            fill="none"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <polyline points="3 17 9 11 13 15 21 7" />
                            <polyline points="14 7 21 7 21 14" />
                          </svg>
                        )}
                        {variation === 0 && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class={cx(style.variationIcon)}
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            stroke-width="2"
                            stroke="currentColor"
                            fill="none"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        )}
                        {variation < 0 && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class={cx(style.variationIcon)}
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            stroke-width="2"
                            stroke="currentColor"
                            fill="none"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <polyline points="3 7 9 13 13 9 21 17" />
                            <polyline points="21 10 21 17 14 17" />
                          </svg>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {labels && labels.length === 0 && (
              <div
                class={cx('text-center', {
                  [style.smallEmptyState]: smallBox,
                  [style.bigEmptyState]: !smallBox
                })}
              >
                <div />
                <div>
                  <i class="fe fe-alert-circle mr-2" />
                  <Text id="dashboard.boxes.chart.noValue" />
                </div>
              </div>
            )}
            {labels && labels.length > 0 && (
              <ApexChartComponent series={series} height={smallBox ? 40 : 80} labels={labels} />
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient')(Chartbox);
