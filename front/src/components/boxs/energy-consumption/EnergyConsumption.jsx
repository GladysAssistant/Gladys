import { Component } from 'preact';
import { forwardRef } from 'preact/compat';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import { Text } from 'preact-i18n';
import DatePicker from 'react-datepicker';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import ApexChartComponent, { DEFAULT_COLORS } from '../chart/ApexChartComponent';
import { formatHttpError } from '../../../utils/formatErrors';
import dayjs from 'dayjs';
import {
  DEFAULT_ENERGY_PERIOD_START_DAY,
  parseEnergyPeriodStartDay,
  getEnergyPeriodStart,
  getEnergyPeriodStartInCalendarUnit,
  getNextEnergyPeriodStart,
  getPreviousEnergyPeriodStart
} from '../../../../../server/utils/energyPeriod';

import fr from 'date-fns/locale/fr';

import 'react-datepicker/dist/react-datepicker.css';
import datePickerStyle from '../../datePicker.css';

const PERIODS = {
  YEAR: 'year',
  MONTH: 'month',
  DAY: 'day'
};

const getPeriodStartDay = box => {
  const periodStartDay = parseEnergyPeriodStartDay(box && box.period_start_day);
  return periodStartDay === null ? DEFAULT_ENERGY_PERIOD_START_DAY : periodStartDay;
};

const DISPLAY_MODES = {
  CURRENCY: 'currency',
  KWH: 'kwh'
};

const PERIOD_LABELS = {
  [PERIODS.YEAR]: 'dashboard.boxes.energyConsumption.year',
  [PERIODS.MONTH]: 'dashboard.boxes.energyConsumption.month',
  [PERIODS.DAY]: 'dashboard.boxes.energyConsumption.day'
};

const SUBSCRIPTION_COLOR = '#b8c2cc';

// The period field is only ever a button opening the calendar: a readonly
// input keeps the mobile on-screen keyboard from popping over the picker.
// It can't be `readOnly` on the customInput element itself — the DatePicker
// clones it and passes its own (undefined) readOnly along, wiping the
// attribute — nor the DatePicker readOnly PROP, which would keep the
// calendar from opening. So this wrapper re-applies it after the merge.
const ReadOnlyInput = forwardRef((props, ref) => <input {...props} ref={ref} readOnly />);

const findDeviceFeatureBySelector = (devices, selector) => {
  if (!devices || !selector) {
    return null;
  }
  for (const device of devices) {
    const feature = (device.features || []).find(f => f.selector === selector);
    if (feature) {
      return { device, feature };
    }
  }
  return null;
};

const getEnergyFeatureDisplayName = (devices, selector, deviceData) => {
  if (deviceData.deviceFeature.is_subscription) {
    return `${deviceData.device.name} - ${deviceData.deviceFeature.name}`;
  }

  const found = findDeviceFeatureBySelector(devices, selector);
  if (found) {
    const { device, feature } = found;
    const featureById = new Map((device.features || []).map(f => [f.id, f]));
    const pathNames = [];
    let current = feature;
    const visited = new Set();

    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      if (current.name) {
        pathNames.unshift(current.name);
      }
      current = current.energy_parent_id ? featureById.get(current.energy_parent_id) : null;
    }

    if (pathNames.length > 0) {
      return pathNames.join(' - ');
    }
  }

  return deviceData.deviceFeature.name
    ? `${deviceData.device.name} - ${deviceData.deviceFeature.name}`
    : deviceData.device.name;
};

const disambiguateDisplayNames = names => {
  const nameCount = {};
  names.forEach(name => {
    nameCount[name] = (nameCount[name] || 0) + 1;
  });

  const nameIndex = {};
  return names.map(name => {
    if (nameCount[name] === 1) {
      return name;
    }
    nameIndex[name] = (nameIndex[name] || 0) + 1;
    return `${name} (${nameIndex[name]})`;
  });
};

class EnergyConsumption extends Component {
  constructor(props) {
    super(props);

    const now = new Date();
    this.state = {
      loading: true,
      error: null,
      errorDetail: null,
      series: [],
      seriesColors: [],
      emptySeries: true,
      selectedPeriod: PERIODS.MONTH,
      // Any date inside the displayed period: the exact start of the period is
      // always derived from it and from the billing period start day
      selectedDate: now,
      displayMode: DISPLAY_MODES.CURRENCY,
      currencyUnit: null
    };
  }

  componentDidMount() {
    this.refreshData();
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.box.device_features !== this.props.box.device_features ||
      prevProps.box.title !== this.props.box.title ||
      prevProps.box.period_start_day !== this.props.box.period_start_day
    ) {
      this.refreshData();
    }
  }

  refreshData = async () => {
    if (!this.props.box.device_features || this.props.box.device_features.length === 0) {
      await this.setState({
        emptySeries: true,
        loading: false
      });
      return;
    }

    await this.setState({ loading: true, error: null, errorDetail: null });

    try {
      const { startDate, endDate } = this.getDateRange();
      const deviceFeatures = this.props.box.device_features;

      const data = await this.props.httpClient.get(`/api/v1/device_feature/energy_consumption`, {
        device_features: deviceFeatures.join(','),
        from: startDate.toISOString(),
        to: endDate.toISOString(),
        group_by: this.getGroupBy(),
        display_mode: this.state.displayMode,
        period_start_day: getPeriodStartDay(this.props.box)
      });

      let emptySeries = true;
      let totalConsumption = 0;
      const series = [];

      // Collect all unique timestamps across all device features
      const allTimestamps = new Set();
      data.forEach(deviceData => {
        deviceData.values.forEach(value => {
          allTimestamps.add(new Date(value.created_at).getTime());
        });
      });

      // Sort timestamps
      const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

      // Get the currency unit from the first device feature that has one
      let currencyUnit = null;
      data.forEach(deviceData => {
        if (deviceData.deviceFeature.currency_unit && !currencyUnit) {
          currencyUnit = deviceData.deviceFeature.currency_unit;
        }
      });

      // Process data for stacked bar chart
      // Each device feature becomes a separate series with aligned timestamps
      // Track colors for each series (gray for subscription, widget colors for consumption)
      const seriesColors = [];
      let colorIndex = 0;
      // Use widget configured colors if available, otherwise fall back to default colors
      const widgetColors = this.props.box.colors || DEFAULT_COLORS;
      let consumptionSelectorIndex = 0;
      const pendingSeries = [];

      data.forEach(deviceData => {
        const isSubscription = deviceData.deviceFeature.is_subscription === true;

        // Skip subscription data if show_subscription_prices is not enabled
        if (isSubscription && !this.props.box.show_subscription_prices) {
          return;
        }

        const selector = isSubscription
          ? null
          : deviceData.deviceFeature.selector || deviceFeatures[consumptionSelectorIndex];
        if (!isSubscription) {
          consumptionSelectorIndex += 1;
        }

        // Create a map of timestamp -> value for this device feature
        const valueMap = new Map();
        deviceData.values.forEach(value => {
          emptySeries = false;
          totalConsumption += parseFloat(value.sum_value);
          const timestamp = new Date(value.created_at).getTime();
          valueMap.set(timestamp, parseFloat(value.sum_value.toFixed(4)));
        });

        // Create series data with all timestamps, filling missing values with 0
        const seriesData = sortedTimestamps.map(timestamp => ({
          x: timestamp,
          y: valueMap.get(timestamp) || 0
        }));

        pendingSeries.push({
          displayName: getEnergyFeatureDisplayName(this.props.devices, selector, deviceData),
          seriesData,
          isSubscription
        });
      });

      const seriesNames = disambiguateDisplayNames(pendingSeries.map(item => item.displayName));

      pendingSeries.forEach((item, index) => {
        // ApexCharts requires unique series names for stacked bars to render correctly.
        series.push({
          name: seriesNames[index],
          data: item.seriesData
        });

        if (item.isSubscription) {
          seriesColors.push(SUBSCRIPTION_COLOR);
        } else {
          seriesColors.push(widgetColors[colorIndex % widgetColors.length]);
          colorIndex++;
        }
      });

      await this.setState({
        series,
        seriesColors,
        loading: false,
        emptySeries,
        totalConsumption,
        currencyUnit
      });
    } catch (e) {
      console.error('Error fetching energy consumption data:', e);
      const error = formatHttpError(e);
      await this.setState({
        error: error.message,
        errorDetail: error.detail,
        loading: false
      });
    }
  };

  getPeriodStart = () => {
    const { selectedPeriod, selectedDate } = this.state;
    return getEnergyPeriodStart(selectedDate, selectedPeriod, getPeriodStartDay(this.props.box));
  };

  getDateRange = () => {
    const { selectedPeriod } = this.state;
    const periodStartDay = getPeriodStartDay(this.props.box);

    const startDate = this.getPeriodStart();
    const endDate = getNextEnergyPeriodStart(startDate, selectedPeriod, periodStartDay);

    return { startDate, endDate };
  };

  getInterval = () => {
    const { selectedPeriod } = this.state;
    switch (selectedPeriod) {
      case PERIODS.YEAR:
        return 'monthly';
      case PERIODS.MONTH:
        return 'daily';
      case PERIODS.DAY:
        return 'hourly';
      default:
        return 'daily';
    }
  };

  getGroupBy = () => {
    const { selectedPeriod } = this.state;
    switch (selectedPeriod) {
      case PERIODS.YEAR:
        return 'month';
      case PERIODS.MONTH:
        return 'day';
      case PERIODS.DAY:
        return 'hour';
      default:
        return 'day';
    }
  };

  changePeriod = period => {
    this.setState({ selectedPeriod: period }, () => {
      this.refreshData();
    });
  };

  navigatePrevious = () => {
    const { selectedPeriod } = this.state;
    const periodStartDay = getPeriodStartDay(this.props.box);
    const newDate = getPreviousEnergyPeriodStart(this.getPeriodStart(), selectedPeriod, periodStartDay);

    this.setState({ selectedDate: newDate }, this.refreshData);
  };

  navigateNext = () => {
    const { selectedPeriod } = this.state;
    const periodStartDay = getPeriodStartDay(this.props.box);
    const newDate = getNextEnergyPeriodStart(this.getPeriodStart(), selectedPeriod, periodStartDay);

    this.setState({ selectedDate: newDate }, this.refreshData);
  };

  onDateChange = date => {
    const periodStartDay = getPeriodStartDay(this.props.box);
    // The date picker returns a month (or a year): display the billing period starting in it
    this.setState(
      { selectedDate: getEnergyPeriodStartInCalendarUnit(date, this.state.selectedPeriod, periodStartDay) },
      this.refreshData
    );
  };

  changeDisplayMode = mode => {
    this.setState({ displayMode: mode }, this.refreshData);
  };

  getCurrencySymbol = () => {
    const { currencyUnit } = this.state;
    if (currencyUnit === 'dollar') {
      return '$';
    }
    return '€';
  };

  yAxisFormatter = value => {
    // ApexCharts calls this formatter with undefined values when a series
    // is hidden through the legend, throwing here would break the tooltip
    if (value === null || value === undefined || Number.isNaN(value)) {
      return value;
    }
    const { displayMode } = this.state;
    const unit = displayMode === DISPLAY_MODES.CURRENCY ? this.getCurrencySymbol() : ' kWh';
    if (value === 0) {
      return `0${unit}`;
    }
    return `${value.toFixed(2)}${unit}`;
  };

  tooltipYFormatter = value => {
    // ApexCharts calls this formatter with undefined values when a series
    // is hidden through the legend, throwing here would break the tooltip
    if (value === null || value === undefined || Number.isNaN(value)) {
      return value;
    }
    const { displayMode } = this.state;
    const unit = displayMode === DISPLAY_MODES.CURRENCY ? this.getCurrencySymbol() : ' kWh';
    return `${value.toFixed(2)}${unit}`;
  };

  tooltipXFormatter = value => {
    const { selectedPeriod } = this.state;
    // Format date based on period - show date only, not datetime
    if (selectedPeriod === PERIODS.DAY) {
      // For day view, show hour only
      return dayjs(value)
        .locale(this.props.user.language)
        .format('HH:mm');
    } else if (selectedPeriod === PERIODS.MONTH) {
      // For month view, show day
      return dayjs(value)
        .locale(this.props.user.language)
        .format('DD MMM YYYY');
    } else {
      // For year view, show month
      return dayjs(value)
        .locale(this.props.user.language)
        .format('MMM YYYY');
    }
  };

  getPeriodRangeLabel = () => {
    const { startDate, endDate } = this.getDateRange();
    const from = dayjs(startDate)
      .locale(this.props.user.language)
      .format('DD MMM YYYY');
    // The end date is exclusive (the period stops at midnight on that day): display it as-is and
    // separate it with an arrow, so the label reads like the bill it is compared with
    // ("from the 5th to the 5th") instead of looking like a day is missing.
    const to = dayjs(endDate)
      .locale(this.props.user.language)
      .format('DD MMM YYYY');
    return `${from} → ${to}`;
  };

  getDatePickerView = () => {
    const { selectedPeriod } = this.state;

    switch (selectedPeriod) {
      case PERIODS.YEAR:
        return 'year';
      case PERIODS.MONTH:
        return 'month';
      case PERIODS.DAY:
        return 'date';
      default:
        return 'month';
    }
  };

  getDateFormat = () => {
    const { selectedPeriod } = this.state;

    switch (selectedPeriod) {
      case PERIODS.YEAR:
        return 'yyyy';
      case PERIODS.MONTH:
        return 'MMMM yyyy';
      case PERIODS.DAY:
        return 'dd/MM/yyyy';
      default:
        return 'MMMM yyyy';
    }
  };

  render(props, state) {
    const {
      loading,
      error,
      errorDetail,
      series,
      seriesColors,
      emptySeries,
      selectedPeriod,
      totalConsumption,
      displayMode
    } = state;
    const localeSet = this.props.user.language === 'fr' ? fr : 'en';
    return (
      <div class="card">
        {/* Widget Title */}
        {props.box.name && (
          <div class="card-header">
            <h5 class="card-title">{props.box.name}</h5>
          </div>
        )}
        <div class="card-body">
          {/* Period Selection: an iOS-like segmented control */}
          <div class="btn-group hz-segmented d-flex mb-3" role="group">
            {Object.values(PERIODS).map(period => (
              <button
                key={period}
                type="button"
                class={cx('btn flex-fill', { active: selectedPeriod === period })}
                onClick={() => this.changePeriod(period)}
              >
                <Text id={PERIOD_LABELS[period]} />
              </button>
            ))}
          </div>

          {/* Navigation Controls */}
          <div class="row mb-2">
            <div class="col-12">
              <div class="d-flex align-items-center">
                <button type="button" class="btn btn-outline-secondary" onClick={this.navigatePrevious}>
                  <i class="fe fe-chevron-left" />
                </button>

                <div class="flex-fill mx-3">
                  <DatePicker
                    locale={localeSet}
                    selected={this.getPeriodStart()}
                    onChange={this.onDateChange}
                    dateFormat={this.getDateFormat()}
                    showMonthYearPicker={selectedPeriod === PERIODS.MONTH}
                    showYearPicker={selectedPeriod === PERIODS.YEAR}
                    className="form-control text-center w-100"
                    wrapperClassName={'w-100'}
                    popperClassName={datePickerStyle.datePickerPopper}
                    portalId="dashboard-datepicker"
                    customInput={<ReadOnlyInput type="text" />}
                  />
                </div>

                <button type="button" class="btn btn-outline-secondary" onClick={this.navigateNext}>
                  <i class="fe fe-chevron-right" />
                </button>
              </div>
            </div>
          </div>

          {/* Billing period range, only displayed when the period does not start on the 1st */}
          {getPeriodStartDay(props.box) !== DEFAULT_ENERGY_PERIOD_START_DAY && selectedPeriod !== PERIODS.DAY && (
            <div class="row mb-2">
              <div class="col-12 text-center">
                <small class="text-muted">{this.getPeriodRangeLabel()}</small>
              </div>
            </div>
          )}

          {/* Display Mode Toggle */}
          <div class="text-center mb-3">
            <div class="btn-group hz-segmented" role="group">
              <button
                type="button"
                class={cx('btn btn-sm', { active: displayMode === DISPLAY_MODES.CURRENCY })}
                onClick={() => this.changeDisplayMode(DISPLAY_MODES.CURRENCY)}
              >
                <Text id="dashboard.boxes.energyConsumption.currency" />
              </button>
              <button
                type="button"
                class={cx('btn btn-sm', { active: displayMode === DISPLAY_MODES.KWH })}
                onClick={() => this.changeDisplayMode(DISPLAY_MODES.KWH)}
              >
                <Text id="dashboard.boxes.energyConsumption.kwh" />
              </button>
            </div>
          </div>

          {/* Chart */}
          <div class="row">
            <div class="col-12">
              <div class={loading ? 'dimmer active' : 'dimmer'}>
                <div class="loader" />
                <div class="dimmer-content">
                  {error && (
                    <div class="alert alert-danger" role="alert">
                      <Text id="dashboard.boxes.energyConsumption.error" />
                      {errorDetail && <div class="mt-2">{errorDetail}</div>}
                    </div>
                  )}

                  {!error && emptySeries && (
                    <div class="alert alert-info" role="alert">
                      <Text id="dashboard.boxes.energyConsumption.noData" />
                    </div>
                  )}

                  {!error && !emptySeries && (
                    <>
                      <div class="text-center mb-2">
                        <h5 class="mb-1 text-muted small">
                          <Text
                            id={
                              displayMode === DISPLAY_MODES.CURRENCY
                                ? 'dashboard.boxes.energyConsumption.totalConsumptionCost'
                                : 'dashboard.boxes.energyConsumption.totalConsumptionKwh'
                            }
                          />
                        </h5>
                        <h3 class="mb-0 font-weight-bold">
                          {totalConsumption.toFixed(2)}{' '}
                          {displayMode === DISPLAY_MODES.CURRENCY ? this.getCurrencySymbol() : 'kWh'}
                        </h3>
                      </div>
                      <ApexChartComponent
                        user={this.props.user}
                        series={series}
                        chart_type="bar"
                        height={300}
                        colors={seriesColors.length > 0 ? seriesColors : DEFAULT_COLORS}
                        size="big"
                        display_axes={true}
                        hide_legend={true}
                        y_axis_formatter={this.yAxisFormatter}
                        tooltip_y_formatter={this.tooltipYFormatter}
                        tooltip_x_formatter={this.tooltipXFormatter}
                        dictionary={props.intl.dictionary}
                        disable_zoom={true}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('user,session,httpClient,houses,devices,deviceFeatures', {})(withIntlAsProp(EnergyConsumption));
