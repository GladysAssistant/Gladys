import { Component } from 'preact';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import { Text } from 'preact-i18n';
import style from './style.css';
import { WEBSOCKET_MESSAGE_TYPES, DEVICE_FEATURE_UNITS } from '../../../../../server/utils/constants';
import { checkAndConvertUnit } from '../../../../../server/utils/units';
import get from 'get-value';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import ApexChartComponent from './ApexChartComponent';
import ChartPeriodToolbar from './ChartPeriodToolbar';
import ChartHeaderValues from './ChartHeaderValues';
import ChartExpandedView from './ChartExpandedView';
import { ONE_HOUR_IN_MINUTES, intervalByName, notNullNotUndefined, getHeaderValues } from './chartUtils';
import { getDeviceName } from '../../../utils/device';
import { formatHttpError } from '../../../utils/formatErrors';

dayjs.extend(localizedFormat);

const UNITS_WHEN_DOWN_IS_POSITIVE = [
  DEVICE_FEATURE_UNITS.WATT_HOUR,
  DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  DEVICE_FEATURE_UNITS.WATT,
  DEVICE_FEATURE_UNITS.KILOWATT,
  DEVICE_FEATURE_UNITS.AQI,
  DEVICE_FEATURE_UNITS.PPM,
  DEVICE_FEATURE_UNITS.PPB,
  DEVICE_FEATURE_UNITS.DECIBEL,
  DEVICE_FEATURE_UNITS.UV_INDEX
];

const getDeviceValueByAggregateFunction = (value, aggregateFunction) => {
  if (aggregateFunction === 'min') {
    return value.min_value;
  } else if (aggregateFunction === 'max') {
    return value.max_value;
  } else if (aggregateFunction === 'sum') {
    return value.sum_value;
  } else if (aggregateFunction === 'count') {
    return value.count_value;
  } else if (aggregateFunction === 'avg') {
    return value.value;
  }
  // The default is the "avg", as before this feature
  // we were not defining an aggregate function
  return value.value;
};

const allEqual = arr => arr.every(val => val === arr[0]);

class Chartbox extends Component {
  // The card raises itself while its period menu is open (see .cardMenuOpen)
  setDropdown = dropdown => {
    this.setState({ dropdown });
  };
  selectInterval = async interval => {
    await this.setState({
      interval,
      offset: 0
    });
    this.getData();
  };
  openExpanded = () => {
    this.setState({ expanded: true });
  };
  closeExpanded = () => {
    this.setState({ expanded: false });
  };
  navigateToPreviousPeriod = async () => {
    await this.setState(prevState => ({
      offset: prevState.offset + prevState.interval
    }));
    this.getData();
  };
  navigateToNextPeriod = async () => {
    if (this.state.offset === 0) {
      return;
    }
    await this.setState(prevState => ({
      offset: Math.max(0, prevState.offset - prevState.interval)
    }));
    this.getData();
  };
  resetToCurrentPeriod = async () => {
    if (this.state.offset === 0) {
      return;
    }
    await this.setState({ offset: 0 });
    this.getData();
  };
  handleWebsocketConnected = ({ connected }) => {
    // When the websocket is disconnected, we refresh the data when the websocket is reconnected
    if (!connected) {
      this.wasDisconnected = true;
    } else if (this.wasDisconnected) {
      this.getData();
      this.wasDisconnected = false;
    }
  };
  getData = async () => {
    let deviceFeatures = this.props.box.device_features;
    let deviceFeatureNames = this.props.box.device_feature_names;

    if (!deviceFeatures) {
      // migrate all box (one device feature)
      if (this.props.box.device_feature) {
        deviceFeatures = [this.props.box.device_feature];
      } else {
        return;
      }
    }
    // counted AFTER the guard above: a chart the user just added to a
    // dashboard has no device_features yet, and reading .length first threw
    // on every single render of the editor canvas
    let nbFeaturesDisplayed = deviceFeatures.length;
    // if there is no device selected
    if (deviceFeatures.length === 0) {
      await this.setState({
        emptySeries: true,
        loading: false
      });
      return;
    }
    await this.setState({ loading: true, error: null, errorDetail: null });
    try {
      const maxStates = 300;

      const queryParams = {
        interval: this.state.interval,
        max_states: this.props.box.group_by ? undefined : maxStates,
        group_by: this.props.box.group_by,
        device_features: deviceFeatures.join(',')
      };
      if (this.state.offset > 0) {
        queryParams.offset = this.state.offset;
      }

      const data = await this.props.httpClient.get(`/api/v1/device_feature/aggregated_states`, queryParams);

      let emptySeries = true;

      // The unit of a device feature can change after the box was configured (device re-created,
      // integration updated...), and the "units" saved in the box config is only a snapshot taken
      // when the feature was added. So we use the unit returned by the API as the source of truth,
      // and only fallback on the box config when the feature has no unit.
      // Note: "unit" (singular) is the legacy attribute, kept for boxes saved before "units" existed.
      const unitsByFeature = data.map((oneFeature, index) => {
        const unitFromBoxConfig = this.props.box.units ? this.props.box.units[index] : this.props.box.unit;
        return get(oneFeature, 'deviceFeature.unit') || unitFromBoxConfig;
      });

      let series = [];

      if (this.props.box.chart_type === 'timeline') {
        const serie0 = {
          name: get(this.props.intl.dictionary, 'dashboard.boxes.chart.off'),
          data: []
        };
        const serie1 = {
          name: get(this.props.intl.dictionary, 'dashboard.boxes.chart.on'),
          data: []
        };
        // Segments still open at the end of the displayed period are clamped to the end of
        // that period, so browsing a past period doesn't stretch the last bar until now.
        const periodEnd = dayjs().subtract(this.state.offset, 'minute');

        const lastValueTime = Math.round(periodEnd.valueOf() / 1000) * 1000;
        data.forEach((oneFeature, index) => {
          const { values, deviceFeature, device } = oneFeature;
          const deviceFeatureName = deviceFeatureNames
            ? deviceFeatureNames[index]
            : getDeviceName(device, deviceFeature);
          if (values.length === 0) {
            nbFeaturesDisplayed = nbFeaturesDisplayed - 1;
          } else {
            values.forEach(value => {
              emptySeries = false;
              const beginTime = Math.round(new Date(value.created_at).getTime() / 1000) * 1000;
              const endTime = value.end_time
                ? Math.round(new Date(value.end_time).getTime() / 1000) * 1000
                : lastValueTime;
              const newData = {
                x: deviceFeatureName,
                y: [beginTime, endTime]
              };
              if (value.value === 0) {
                serie0.data.push(newData);
              } else {
                serie1.data.push(newData);
              }
            });
          }
        });
        series.push(serie1);
        series.push(serie0);
      } else {
        series = data.map((oneFeature, index) => {
          const oneUnit = unitsByFeature[index];
          // Convert unit display format if necessary (using 0 as a dummy value since we only need the unit)
          const userUnitPreference = this.props.user.distance_unit_preference;
          const { unit: displayUnit } = checkAndConvertUnit(0, oneUnit, userUnitPreference);

          const oneUnitTranslated = displayUnit ? this.props.intl.dictionary.deviceFeatureUnitShort[displayUnit] : null;
          const { values, deviceFeature, device } = oneFeature;
          const deviceFeatureName = deviceFeatureNames
            ? deviceFeatureNames[index]
            : getDeviceName(device, deviceFeature);
          const name = oneUnitTranslated ? `${deviceFeatureName} (${oneUnitTranslated})` : deviceFeatureName;
          return {
            name,
            data: values.map(dataPoint => {
              emptySeries = false;
              const rawValue = getDeviceValueByAggregateFunction(dataPoint, this.props.box.aggregate_function);

              // Convert the value if it is a convertible unit
              const { value: displayValue } = checkAndConvertUnit(rawValue, oneUnit, userUnitPreference);

              return [Math.round(new Date(dataPoint.created_at).getTime() / 1000) * 1000, displayValue];
            })
          };
        });
      }
      const newState = {
        series,
        loading: false,
        initialized: true,
        emptySeries,
        nbFeaturesDisplayed
      };

      if (data.length > 0 && this.props.box.chart_type !== 'timeline') {
        const unit = unitsByFeature[0];

        // Convert distance units if necessary
        const userUnitPreference = this.props.user.distance_unit_preference;
        let displayUnit = unit;

        // We check if all deviceFeatures selected are in the same unit
        const allUnitsAreSame = this.props.box.units ? allEqual(unitsByFeature) : false;

        // First and last value of the period for each feature (one entry per series, in the same
        // order as the chart series). If all features share the same unit, they are all summarized
        // and averaged together, otherwise only the first feature is displayed.
        // The header (last value + variation) is derived from these summaries, restricted to the
        // series currently visible in the chart legend (see getHeaderValues).
        const featuresSummary = data.map((oneFeature, index) => {
          const { values } = oneFeature;
          if (values.length === 0 || (!allUnitsAreSame && index > 0)) {
            return null;
          }
          const firstElement = values[0];
          const lastElement = values[values.length - 1];
          const rawFirstValue = getDeviceValueByAggregateFunction(firstElement, this.props.box.aggregate_function);
          const rawLastValue = getDeviceValueByAggregateFunction(lastElement, this.props.box.aggregate_function);
          if (!notNullNotUndefined(rawFirstValue) || !notNullNotUndefined(rawLastValue)) {
            return null;
          }
          // Convert the value if it is a convertible unit
          const { value: firstValue, unit: firstElementUnit } = checkAndConvertUnit(
            rawFirstValue,
            unit,
            userUnitPreference
          );
          const { value: lastValue } = checkAndConvertUnit(rawLastValue, unit, userUnitPreference);
          displayUnit = firstElementUnit;
          return { firstValue, lastValue };
        });

        newState.featuresSummary = featuresSummary;
        newState.variationDownIsPositive = UNITS_WHEN_DOWN_IS_POSITIVE.includes(displayUnit);
        newState.unit = displayUnit;
        Object.assign(newState, getHeaderValues(featuresSummary, this.state.hiddenSeriesIndexes));
      }
      await this.setState(newState);
    } catch (e) {
      console.error(e);
      const { errorString, errorDetailString } = formatHttpError(e);
      this.setState({
        loading: false,
        error: errorString,
        errorDetail: errorDetailString
      });
    }
  };
  updateDeviceStateWebsocket = payload => {
    if (
      this.state.offset === 0 &&
      this.state.interval === intervalByName['last-hour'] &&
      this.props.box.device_features &&
      this.props.box.device_features.includes(payload.device_feature_selector)
    ) {
      this.getData();
    }
  };
  // Called by the chart each time it is drawn, with the indexes of the series hidden through
  // the legend: recompute the header from the series that are actually visible.
  handleHiddenSeriesChange = hiddenSeriesIndexes => {
    this.setState(prevState => {
      if (
        hiddenSeriesIndexes.length === prevState.hiddenSeriesIndexes.length &&
        hiddenSeriesIndexes.every((index, position) => index === prevState.hiddenSeriesIndexes[position])
      ) {
        return null;
      }
      return {
        hiddenSeriesIndexes,
        ...getHeaderValues(prevState.featuresSummary, hiddenSeriesIndexes)
      };
    });
  };
  updateInterval = async () => {
    await this.setState({
      interval: intervalByName[this.props.box.interval],
      offset: 0
    });
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      interval: this.props.box.interval ? intervalByName[this.props.box.interval] : ONE_HOUR_IN_MINUTES,
      offset: 0,
      loading: true,
      initialized: false,
      height: 'small',
      nbFeaturesDisplayed: 0,
      featuresSummary: [],
      hiddenSeriesIndexes: []
    };
  }
  componentDidMount() {
    this.getData();
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.updateDeviceStateWebsocket
    );
    this.props.session.dispatcher.addListener('websocket.connected', this.handleWebsocketConnected);
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
    this.props.session.dispatcher.removeListener('websocket.connected', this.handleWebsocketConnected);
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
      offset,
      emptySeries,
      unit,
      nbFeaturesDisplayed,
      error,
      errorDetail,
      expanded,
      featuresSummary
    }
  ) {
    const { box } = this.props;
    const displayVariation = box.display_variation;
    // The hidden series are positional, in ApexCharts as in the header: recreate the chart
    // (all series visible again) when the devices of the box change, e.g. in the editor.
    // Same fallback on the legacy "device_feature" (one device) attribute as in getData.
    const deviceFeaturesKey = (box.device_features || [box.device_feature]).join(',');
    let additionalHeight = 30 * (nbFeaturesDisplayed - 1);
    if (props.box.chart_type === 'timeline') {
      additionalHeight = 55 * nbFeaturesDisplayed;
    }
    return (
      <div class={cx('card', { 'loading-border': initialized && loading, [style.cardMenuOpen]: dropdown })}>
        <div class="card-body">
          <div class={style.chartHeader}>
            <div class={style.chartTitleRow}>
              <div class={cx(style.subheader)}>{box.title}</div>
              {props.box.chart_type && (
                <button
                  type="button"
                  class={style.expandButton}
                  onClick={this.openExpanded}
                  title={props.intl.dictionary.dashboard.boxes.chart.expand}
                  aria-label={props.intl.dictionary.dashboard.boxes.chart.expand}
                  data-cy="chart-expand"
                >
                  <i class="fe fe-maximize-2" />
                </button>
              )}
            </div>
            {props.box.chart_type && (
              <ChartPeriodToolbar
                interval={interval}
                offset={offset}
                chartType={props.box.chart_type}
                language={props.user.language}
                dictionary={props.intl.dictionary}
                onPrevious={this.navigateToPreviousPeriod}
                onNext={this.navigateToNextPeriod}
                onBackToNow={this.resetToCurrentPeriod}
                onSelectInterval={this.selectInterval}
                onDropdownChange={this.setDropdown}
              />
            )}
          </div>

          {props.box.chart_type && (
            <div>
              {displayVariation && props.box.chart_type !== 'timeline' && emptySeries === false && (
                <ChartHeaderValues
                  lastValueRounded={lastValueRounded}
                  unit={unit}
                  variation={variation}
                  variationDownIsPositive={variationDownIsPositive}
                />
              )}
              {emptySeries === false && props.box.display_axes && (
                <div class="mt-4">
                  <ApexChartComponent
                    key={deviceFeaturesKey}
                    series={series}
                    interval={interval}
                    user={props.user}
                    size="big"
                    chart_type={props.box.chart_type}
                    display_axes={props.box.display_axes}
                    colors={props.box.colors}
                    additionalHeight={additionalHeight}
                    dictionary={props.intl.dictionary}
                    onHiddenSeriesChange={this.handleHiddenSeriesChange}
                  />
                </div>
              )}
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
            {!props.box.chart_type && (
              <div class={cx('text-center', style.bigEmptyState)}>
                <div />
                <div>
                  <i class="fe fe-alert-circle mr-2" />
                  <Text id="dashboard.boxes.chart.noChartType" />
                </div>
                <div class={style.smallTextEmptyState}>
                  <Text id="dashboard.boxes.chart.noChartTypeWarning" />
                </div>
              </div>
            )}
            {error && (
              <div class={cx('text-center', style.bigEmptyState)}>
                <div>
                  <i class="fe fe-alert-circle mr-2" />
                  {error}
                </div>
                {errorDetail && <div>{errorDetail}</div>}
              </div>
            )}
            {props.box.chart_type && (
              <div>
                {emptySeries === true && (
                  <div class={cx('text-center', style.bigEmptyState)}>
                    <div />
                    <div>
                      <i class="fe fe-alert-circle mr-2" />
                      <Text id="dashboard.boxes.chart.noValue" />
                    </div>
                  </div>
                )}
                {emptySeries === false && !props.box.display_axes && (
                  <ApexChartComponent
                    key={deviceFeaturesKey}
                    series={series}
                    interval={interval}
                    user={props.user}
                    size="big"
                    chart_type={props.box.chart_type}
                    display_axes={props.box.display_axes}
                    colors={props.box.colors}
                    additionalHeight={additionalHeight}
                    dictionary={props.intl.dictionary}
                    onHiddenSeriesChange={this.handleHiddenSeriesChange}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {props.box.chart_type && (
          <ChartExpandedView
            open={Boolean(expanded)}
            onClose={this.closeExpanded}
            box={box}
            user={props.user}
            dictionary={props.intl.dictionary}
            series={series}
            seriesKey={deviceFeaturesKey}
            interval={interval}
            offset={offset}
            loading={loading}
            emptySeries={emptySeries}
            error={error}
            errorDetail={errorDetail}
            featuresSummary={featuresSummary}
            unit={unit}
            variationDownIsPositive={variationDownIsPositive}
            nbFeaturesDisplayed={nbFeaturesDisplayed}
            onPrevious={this.navigateToPreviousPeriod}
            onNext={this.navigateToNextPeriod}
            onBackToNow={this.resetToCurrentPeriod}
            onSelectInterval={this.selectInterval}
          />
        )}
      </div>
    );
  }
}

export default withIntlAsProp(connect('httpClient,session,user')(Chartbox));
