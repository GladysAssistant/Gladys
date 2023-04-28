import { Component } from 'preact';
import { connect } from 'unistore/preact';
import cx from 'classnames';

import { Text } from 'preact-i18n';
import style from './style.css';
import { WEBSOCKET_MESSAGE_TYPES, DEVICE_FEATURE_UNITS } from '../../../../../server/utils/constants';
import get from 'get-value';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import ApexChartComponent from './ApexChartComponent';

const ONE_HOUR_IN_MINUTES = 60;
const ONE_DAY_IN_MINUTES = 24 * 60;
const SEVEN_DAYS_IN_MINUTES = 7 * 24 * 60;
const THIRTY_DAYS_IN_MINUTES = 30 * 24 * 60;
const THREE_MONTHS_IN_MINUTES = 3 * 30 * 24 * 60;
const ONE_YEAR_IN_MINUTES = 365 * 24 * 60;

const intervalByName = {
  'last-hour': ONE_HOUR_IN_MINUTES,
  'last-day': ONE_DAY_IN_MINUTES,
  'last-week': SEVEN_DAYS_IN_MINUTES,
  'last-month': THIRTY_DAYS_IN_MINUTES,
  'last-three-months': THREE_MONTHS_IN_MINUTES,
  'last-year': ONE_YEAR_IN_MINUTES
};

const UNITS_WHEN_DOWN_IS_POSITIVE = [DEVICE_FEATURE_UNITS.WATT_HOUR];

const notNullNotUndefined = value => {
  return value !== undefined && value !== null;
};

const average = arr => arr.reduce((p, c) => p + c, 0) / arr.length;

const roundWith2DecimalIfNeeded = value => {
  if (!notNullNotUndefined(value)) {
    return null;
  }
  // we want to avoid displaying "15.00" if it's just 15
  if (Number.isInteger(value)) {
    return Math.round(value);
  }
  return parseFloat(value).toFixed(2);
};

const calculateVariation = (firstValue, lastValue) => {
  if (!notNullNotUndefined(firstValue) || !notNullNotUndefined(lastValue)) {
    return null;
  }
  if (firstValue === 0 && lastValue === 0) {
    return 0;
  }
  if (firstValue === 0 && lastValue > firstValue) {
    return Infinity;
  }
  if (firstValue === 0 && lastValue < firstValue) {
    return -Infinity;
  }
  return Math.round(((lastValue - firstValue) / Math.abs(firstValue)) * 100);
};

const allEqual = arr => arr.every(val => val === arr[0]);

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
  switchTo30DaysView = async () => {
    await this.setState({
      interval: THIRTY_DAYS_IN_MINUTES,
      dropdown: false
    });
    this.getData();
  };
  switchTo3monthsView = async () => {
    await this.setState({
      interval: THREE_MONTHS_IN_MINUTES,
      dropdown: false
    });
    this.getData();
  };
  switchToYearlyView = async () => {
    await this.setState({
      interval: ONE_YEAR_IN_MINUTES,
      dropdown: false
    });
    this.getData();
  };
  getData = async () => {
    let deviceFeatures = this.props.box.device_features;
    if (!deviceFeatures) {
      // migrate all box (one device feature)
      if (this.props.box.device_feature) {
        deviceFeatures = [this.props.box.device_feature];
      } else {
        return;
      }
    }
    // if there is no device selected
    if (deviceFeatures.length === 0) {
      await this.setState({
        emptySeries: true,
        loading: false
      });
      return;
    }
    await this.setState({ loading: true });
    try {
      const data = await this.props.httpClient.get(`/api/v1/device_feature/aggregated_states`, {
        interval: this.state.interval,
        max_states: 100,
        device_features: deviceFeatures.join(',')
      });

      let emptySeries = true;

      const series = data.map((oneFeature, index) => {
        const oneUnit = this.props.box.units ? this.props.box.units[index] : this.props.box.unit;
        const oneUnitTranslated = oneUnit ? this.props.intl.dictionary.deviceFeatureUnitShort[oneUnit] : null;
        const { values, deviceFeature } = oneFeature;
        const deviceName = deviceFeature.name;
        const name = oneUnitTranslated ? `${deviceName} (${oneUnitTranslated})` : deviceName;
        return {
          name,
          data: values.map(value => {
            emptySeries = false;
            return {
              x: value.created_at,
              y: value.value
            };
          })
        };
      });

      const newState = {
        series,
        loading: false,
        initialized: true,
        emptySeries
      };

      if (data.length > 0) {
        // Before now, there was a "unit" attribute in this box instead of "units",
        // so we need to support "unit" as some users may already have the box with that param
        const unit = this.props.box.units ? this.props.box.units[0] : this.props.box.unit;
        // We check if all deviceFeatures selected are in the same unit
        const allUnitsAreSame = this.props.box.units ? allEqual(this.props.box.units) : false;

        // If all deviceFeatures selected are in the same unit
        // We do a average of all values
        if (allUnitsAreSame) {
          const lastValuesArray = [];
          const variationArray = [];
          data.forEach(oneFeature => {
            const { values } = oneFeature;
            if (values.length === 0) {
              return;
            }
            const firstElement = values[0];
            const lastElement = values[values.length - 1];
            const variation = calculateVariation(firstElement.value, lastElement.value);
            const lastValue = lastElement.value;
            variationArray.push(variation);
            lastValuesArray.push(lastValue);
          });
          newState.variation = average(variationArray);
          newState.variationDownIsPositive = UNITS_WHEN_DOWN_IS_POSITIVE.includes(unit);
          newState.lastValueRounded = roundWith2DecimalIfNeeded(average(lastValuesArray));
          newState.unit = unit;
        } else {
          // If not, we only display the first value
          const oneFeature = data[0];
          const { values } = oneFeature;
          if (values.length > 0) {
            const firstElement = values[0];
            const lastElement = values[values.length - 1];
            newState.variation = calculateVariation(firstElement.value, lastElement.value);
            newState.variationDownIsPositive = UNITS_WHEN_DOWN_IS_POSITIVE.includes(unit);
            newState.lastValueRounded = roundWith2DecimalIfNeeded(lastElement.value);
            newState.unit = unit;
          }
        }
      }

      await this.setState(newState);
    } catch (e) {
      console.error(e);
    }
  };
  updateDeviceStateWebsocket = payload => {
    if (
      this.state.interval === intervalByName['last-hour'] &&
      this.props.box.device_features &&
      this.props.box.device_features.includes(payload.device_feature_selector)
    ) {
      this.getData();
    }
  };
  updateInterval = async () => {
    await this.setState({
      interval: intervalByName[this.props.box.interval]
    });
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      interval: this.props.box.interval ? intervalByName[this.props.box.interval] : ONE_HOUR_IN_MINUTES,
      loading: true,
      initialized: false,
      height: 'small'
    };
  }
  componentDidMount() {
    this.getData();
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.updateDeviceStateWebsocket
    );
  }
  async componentDidUpdate(previousProps) {
    const intervalChanged = get(previousProps, 'box.interval') !== get(this.props, 'box.interval');
    const deviceFeaturesChanged = get(previousProps, 'box.device_features') !== get(this.props, 'box.device_features');
    const titleChanged = get(previousProps, 'box.title') !== get(this.props, 'box.title');
    const unitChanged = get(previousProps, 'box.unit') !== get(this.props, 'box.unit');
    if (intervalChanged) {
      await this.updateInterval(this.props.box.interval);
    }
    if (intervalChanged || deviceFeaturesChanged || titleChanged || unitChanged) {
      this.getData();
    }
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.updateDeviceStateWebsocket
    );
  }
  render(
    props,
    {
      initialized,
      loading,
      series,
      dropdown,
      variation,
      variationDownIsPositive,
      lastValueRounded,
      interval,
      emptySeries,
      unit
    }
  ) {
    const displayVariation = props.box.display_variation;
    return (
      <div class={cx('card', { 'loading-border': initialized && loading })}>
        <div class="card-body">
          <div class="d-flex align-items-center">
            <div class={cx(style.subheader)}>{props.box.title}</div>
            <div class={cx(style.msAuto, style.lh1)}>
              <div class="dropdown">
                <a class="dropdown-toggle text-muted text-nowrap" onClick={this.toggleDropdown}>
                  {interval === ONE_HOUR_IN_MINUTES && <Text id="dashboard.boxes.chart.lastHour" />}
                  {interval === ONE_DAY_IN_MINUTES && <Text id="dashboard.boxes.chart.lastDay" />}
                  {interval === SEVEN_DAYS_IN_MINUTES && <Text id="dashboard.boxes.chart.lastSevenDays" />}
                  {interval === THIRTY_DAYS_IN_MINUTES && <Text id="dashboard.boxes.chart.lastThirtyDays" />}
                  {interval === THREE_MONTHS_IN_MINUTES && <Text id="dashboard.boxes.chart.lastThreeMonths" />}
                  {interval === ONE_YEAR_IN_MINUTES && <Text id="dashboard.boxes.chart.lastYear" />}
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
                  <a
                    class={cx(style.dropdownItemChart, {
                      [style.active]: interval === ONE_YEAR_IN_MINUTES
                    })}
                    onClick={this.switchToYearlyView}
                  >
                    <Text id="dashboard.boxes.chart.lastYear" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {displayVariation && emptySeries === false && (
            <div class="d-flex align-items-baseline">
              {notNullNotUndefined(lastValueRounded) && !Number.isNaN(lastValueRounded) && (
                <div class="h1 mb-0 mr-2">
                  {lastValueRounded}
                  {unit !== undefined && <Text id={`deviceFeatureUnitShort.${unit}`} />}
                </div>
              )}
              <div
                class={cx(style.meAuto, {
                  [style.textGreen]:
                    (variation > 0 && !variationDownIsPositive) || (variation < 0 && variationDownIsPositive),
                  [style.textYellow]: variation === 0,
                  [style.textRed]:
                    (variation > 0 && variationDownIsPositive) || (variation < 0 && !variationDownIsPositive)
                })}
              >
                {variation !== undefined && (
                  <span class="d-inline-flex align-items-center lh-1">
                    {roundWith2DecimalIfNeeded(variation)}
                    <Text id="global.percent" />
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
          {emptySeries === false && props.box.display_axes && (
            <div class="mt-4">
              <ApexChartComponent
                series={series}
                interval={interval}
                user={props.user}
                size="big"
                chart_type={props.box.chart_type}
                display_axes={props.box.display_axes}
              />
            </div>
          )}
        </div>

        <div
          class={cx('dimmer', {
            active: loading && !initialized
          })}
        >
          <div class="loader" />
          <div
            class={cx('dimmer-content', {
              [style.minSizeChartLoading]: loading && !initialized
            })}
          >
            {emptySeries === true && (
              <div class={cx('text-center', style.bigEmptyState)}>
                <div />
                <div>
                  <i class="fe fe-alert-circle mr-2" />
                  <Text id="dashboard.boxes.chart.noValue" />
                </div>
                <div class={style.smallTextEmptyState}>
                  <Text id="dashboard.boxes.chart.noValueWarning" />
                </div>
              </div>
            )}
            {emptySeries === false && !props.box.display_axes && (
              <ApexChartComponent
                series={series}
                interval={interval}
                user={props.user}
                size="big"
                chart_type={props.box.chart_type}
                display_axes={props.box.display_axes}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default withIntlAsProp(connect('httpClient,session,user')(Chartbox));
