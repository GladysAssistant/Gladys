import { Component, createRef } from 'preact';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import { Text } from 'preact-i18n';
import get from 'get-value';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import ApexChartComponent from '../chart/ApexChartComponent';
import { getDeviceName } from '../../../utils/device';
import { formatHttpError } from '../../../utils/formatErrors';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../server/utils/constants';

import fr from 'date-fns/locale/fr';

import 'react-datepicker/dist/react-datepicker.css';

const PERIODS = {
  YEAR: 'year',
  MONTH: 'month',
  DAY: 'day'
};

const PERIOD_LABELS = {
  [PERIODS.YEAR]: 'dashboard.boxes.energyConsumption.year',
  [PERIODS.MONTH]: 'dashboard.boxes.energyConsumption.month',
  [PERIODS.DAY]: 'dashboard.boxes.energyConsumption.day'
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
      emptySeries: true,
      selectedPeriod: PERIODS.MONTH,
      selectedDate: now
    };
  }

  componentDidMount() {
    this.refreshData();
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.box.device_features !== this.props.box.device_features ||
      prevProps.box.title !== this.props.box.title
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

      const data = await this.props.httpClient.get(`/api/v1/device_feature/aggregated_states`, {
        device_features: deviceFeatures.join(','),
        from: startDate.toISOString(),
        to: endDate.toISOString(),
        group_by: this.getGroupBy()
      });

      let emptySeries = true;
      let totalConsumption = 0;
      const series = [];

      // Process data for bar chart
      data.forEach(device => {
        series.push({
          name: device.device.name,
          data: []
        });
        device.values.forEach(value => {
          emptySeries = false;
          totalConsumption += parseFloat(value.sum_value);
          const date = new Date(value.created_at);
          series[series.length - 1].data.push({
            x: date,
            y: parseFloat(value.sum_value.toFixed(4))
          });
        });
      });

      await this.setState({
        series,
        loading: false,
        emptySeries,
        totalConsumption
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

  getDateRange = () => {
    const { selectedPeriod, selectedDate } = this.state;
    let startDate, endDate;

    switch (selectedPeriod) {
      case PERIODS.YEAR:
        startDate = new Date(selectedDate.getFullYear(), 0, 1);
        endDate = new Date(selectedDate.getFullYear() + 1, 0, 1);
        break;
      case PERIODS.MONTH:
        startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
        break;
      case PERIODS.DAY:
        startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1);
        break;
      default:
        startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
    }

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
    const { selectedPeriod, selectedDate } = this.state;
    let newDate = new Date(selectedDate);

    switch (selectedPeriod) {
      case PERIODS.YEAR:
        newDate.setFullYear(selectedDate.getFullYear() - 1);
        break;
      case PERIODS.MONTH:
        newDate.setMonth(selectedDate.getMonth() - 1);
        break;
      case PERIODS.DAY:
        newDate.setDate(selectedDate.getDate() - 1);
        break;
    }

    this.setState({ selectedDate: newDate }, this.refreshData);
  };

  navigateNext = () => {
    const { selectedPeriod, selectedDate } = this.state;
    let newDate = new Date(selectedDate);

    switch (selectedPeriod) {
      case PERIODS.YEAR:
        newDate.setFullYear(selectedDate.getFullYear() + 1);
        break;
      case PERIODS.MONTH:
        newDate.setMonth(selectedDate.getMonth() + 1);
        break;
      case PERIODS.DAY:
        newDate.setDate(selectedDate.getDate() + 1);
        break;
    }

    this.setState({ selectedDate: newDate }, this.refreshData);
  };

  onDateChange = date => {
    this.setState({ selectedDate: date }, this.refreshData);
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
    const { loading, error, errorDetail, series, emptySeries, selectedPeriod, totalConsumption } = state;
    const localeSet = this.props.user.language === 'fr' ? fr : 'en';
    return (
      <div class="card">
        <div class="card-body">
          {/* Period Selection Buttons */}
          <div class="row mb-3">
            <div class="col-12">
              <div class="d-flex justify-content-between">
                {Object.values(PERIODS).map(period => (
                  <button
                    key={period}
                    type="button"
                    class={cx('btn flex-fill mx-1', {
                      'btn-primary': selectedPeriod === period,
                      'btn-outline-primary': selectedPeriod !== period
                    })}
                    onClick={() => this.changePeriod(period)}
                  >
                    <Text id={PERIOD_LABELS[period]} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div class="row mb-3">
            <div class="col-12">
              <div class="d-flex align-items-center">
                <button type="button" class="btn btn-outline-secondary" onClick={this.navigatePrevious}>
                  <i class="fe fe-chevron-left" />
                </button>

                <div class="flex-fill mx-3">
                  <DatePicker
                    locale={localeSet}
                    selected={this.state.selectedDate}
                    onChange={this.onDateChange}
                    dateFormat={this.getDateFormat()}
                    showMonthYearPicker={selectedPeriod === PERIODS.MONTH}
                    showYearPicker={selectedPeriod === PERIODS.YEAR}
                    className="form-control text-center w-100"
                    wrapperClassName={'w-100'}
                  />
                </div>

                <button type="button" class="btn btn-outline-secondary" onClick={this.navigateNext}>
                  <i class="fe fe-chevron-right" />
                </button>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div class="row">
            <div class="col-12">
              {loading && (
                <div class="text-center">
                  <div class="spinner-border" role="status">
                    <span class="sr-only">
                      <Text id="global.loading" />
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div class="alert alert-danger" role="alert">
                  <Text id="dashboard.boxes.energyConsumption.error" />
                  {errorDetail && <div class="mt-2">{errorDetail}</div>}
                </div>
              )}

              {!loading && !error && emptySeries && (
                <div class="alert alert-info" role="alert">
                  <Text id="dashboard.boxes.energyConsumption.noData" />
                </div>
              )}

              {!loading && !error && !emptySeries && (
                <>
                  <div class="row mb-2">
                    <div class="col-12">
                      <div class="card border-0 mb-0">
                        <div class="card-body text-center py-3">
                          <div class="d-flex align-items-center justify-content-center">
                            <div>
                              <h5 class="mb-1 text-muted small">
                                <Text id="dashboard.boxes.energyConsumption.totalConsumption" />
                              </h5>
                              <h3 class="mb-0 text-primary font-weight-bold">{totalConsumption.toFixed(2)} €</h3>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ApexChartComponent
                    user={this.props.user}
                    series={series}
                    chart_type="bar"
                    height={300}
                    colors={['#467fcf']}
                    size="big"
                    display_axes={true}
                    dictionary={props.intl.dictionary}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('user,session,httpClient,houses,devices,deviceFeatures', {})(withIntlAsProp(EnergyConsumption));
