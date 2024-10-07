import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { connect } from 'unistore/preact';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import get from 'get-value';
import style from './style.css';
import Chart from '../../../components/boxs/chart/Chart';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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

const criteriaDateExpendOptions = [
  { value: 'all', label: <Text id="dashboard.boxes.chart.criteria.date.all" /> },
  { value: 'previous', label: <Text id="dashboard.boxes.chart.criteria.date.previous" /> },
  { value: 'current', label: <Text id="dashboard.boxes.chart.criteria.date.current" /> },
  { value: 'next', label: <Text id="dashboard.boxes.chart.criteria.date.next" /> },
  { value: 'before', label: <Text id="dashboard.boxes.chart.criteria.date.before" /> },
  { value: 'after', label: <Text id="dashboard.boxes.chart.criteria.date.after" /> },
  { value: 'between', label: <Text id="dashboard.boxes.chart.criteria.date.between" /> },
  { value: 'custom', label: <Text id="dashboard.boxes.chart.criteria.date.custom" /> }
];
const criteriaAggregateExpendOptions = [
  { value: 'minute', label: <Text id="dashboard.boxes.chart.criteria.aggregate.minute" /> },
  { value: 'hour', label: <Text id="dashboard.boxes.chart.criteria.aggregate.hour" /> },
  { value: 'day', label: <Text id="dashboard.boxes.chart.criteria.aggregate.day" /> },
  { value: 'week', label: <Text id="dashboard.boxes.chart.criteria.aggregate.week" /> },
  { value: 'month', label: <Text id="dashboard.boxes.chart.criteria.aggregate.month" /> },
  { value: 'year', label: <Text id="dashboard.boxes.chart.criteria.aggregate.year" /> },
  { value: 'quarter', label: <Text id="dashboard.boxes.chart.criteria.aggregate.quarter" /> },
  { value: 'notAggregate', label: <Text id="dashboard.boxes.chart.criteria.aggregate.notAggregate" /> }
];

const intervalUnit = [
  { value: 'days', label: <Text id="dashboard.boxes.chart.criteria.intervalUnit.days" /> },
  { value: 'weeks', label: <Text id="dashboard.boxes.chart.criteria.intervalUnit.weeks" /> },
  { value: 'months', label: <Text id="dashboard.boxes.chart.criteria.intervalUnit.months" /> },
  { value: 'quarter', label: <Text id="dashboard.boxes.chart.criteria.intervalUnit.quarter" /> },
  { value: 'years', label: <Text id="dashboard.boxes.chart.criteria.intervalUnit.years" /> }
];
const intervalUnitCurrent = [
  { value: 'days', label: <Text id="dashboard.boxes.chart.criteria.intervalUnit.thisDays" /> },
  { value: 'weeks', label: <Text id="dashboard.boxes.chart.criteria.intervalUnit.thisWeeks" /> },
  { value: 'months', label: <Text id="dashboard.boxes.chart.criteria.intervalUnit.thisMonths" /> },
  { value: 'quarter', label: <Text id="dashboard.boxes.chart.criteria.intervalUnit.thisQuarter" /> },
  { value: 'years', label: <Text id="dashboard.boxes.chart.criteria.intervalUnit.thisYears" /> }
];

const ChartBoxExpanded = ({ children, ...props }) => (
  <div class={cx('container', style.containerWithMargin)}>
    <div class="row">
      <div class="col mx-auto">
        <div class="card">
          <div class={props.loading ? 'dimmer active' : 'dimmer'}>
            <div class="loader" />
            <div class="dimmer-content">
              <div class="card-body p-5">
                <div class="card-title d-flex align-items-center">
                  <Link href={`/dashboard/${props.dashboardSelector}`} class="btn btn-secondary btn-ml mr-3">
                    <i class="fe fe-chevron-left"/>
                  </Link>
                  <h3 class="mb-0">
                    {props.name} - {props.box.title}
                  </h3>
                </div>
                {props.dashboardAlreadyExistError && (
                  <div class="alert alert-danger">
                    <Text id="newDashboard.dashboardAlreadyExist" />
                  </div>
                )}
                {props.unknownError && (
                  <div class="alert alert-danger">
                    <Text id="newDashboard.unknownError" />
                  </div>
                )}
                <Chart
                  {...props}
                  showHistoryExpanded={true}
                  showCloseButton={true}
                  boxOptions={props.boxOptions}
                  onIntervalChange={props.handleIntervalChange}
                />
              </div>
              <div class={cx(style.cardFooter, 'pl-5 pr-5 d-flex align-items-center justify-content-between')}>
                <div class={cx('d-flex align-items-center', style.flexContainer)}>
                  <h5 class="mb-0 mr-3">
                    <Text id="dashboard.boxes.chart.criteria.criteriaDateExpendOptionsTitle" />
                  </h5>
                  <div class={cx('btn-group dropup', style.dropdownMenuUp, { show: props.dropdownOpenGlobal })}>
                    <Localizer>
                      <button
                        class="btn btn-secondary dropdown-toggle"
                        type="button"
                        onClick={props.toggleDropdownGlobal}
                      >
                        {props.selectedCriteriaDate === 'all' ? (
                          <Text id="dashboard.boxes.chart.criteria.date.all" />
                        ) : props.selectedCriteriaDate === 'previous' ||
                          props.selectedCriteriaDate === 'next' ||
                          props.selectedCriteriaDate === 'current' ? (
                          <span>
                            {
                              criteriaDateExpendOptions.find(option => option.value === props.selectedCriteriaDate)
                                .label
                            }
                            {` ${props.boxOptions.interval}`}
                            {intervalUnit.find(option => option.value === props.boxOptions.intervalUnit).label}
                          </span>
                        ) : props.selectedCriteriaDate === 'current' ? (
                          intervalUnitCurrent.find(option => option.value === props.boxOptions.intervalUnit).label
                        ) : props.selectedCriteriaDate === 'next' ? (
                          <Text id="dashboard.boxes.chart.criteria.date.next" />
                        ) : props.selectedCriteriaDate === 'before' ? (
                          <Text id="dashboard.boxes.chart.criteria.date.before" />
                        ) : props.selectedCriteriaDate === 'after' ? (
                          <Text id="dashboard.boxes.chart.criteria.date.after" />
                        ) : props.selectedCriteriaDate === 'between' ? (
                          <Text id="dashboard.boxes.chart.criteria.date.between" />
                        ) : props.selectedCriteriaDate === 'custom' ? (
                          <Text id="dashboard.boxes.chart.criteria.date.custom" />
                        ) : (
                          criteriaDateExpendOptions.find(option => option.value === props.selectedCriteriaDate).label
                        )}
                      </button>
                    </Localizer>
                    {props.dropdownOpenGlobal && (
                      <div class={cx('dropdown-menu d-flex flex-column', style.dropdownMenuDown, 'p-3')}>
                        <div class={cx('dropdown', { show: props.dropdownOpenCriteriaDate })}>
                          <button
                            class="btn btn-secondary btn-block align-items-center mb-2"
                            type="button"
                            onClick={props.toggleDropdownCriteriaDate}
                          >
                            <span class="text-left">
                              {
                                criteriaDateExpendOptions.find(option => option.value === props.selectedCriteriaDate)
                                  .label
                              }
                            </span>
                            <span class="text-right">
                              <i class="fe fe-chevron-down"/>
                            </span>
                          </button>
                          <div
                            class={cx('dropdown-menu', style.dropdownMenuDown, {
                              show: props.dropdownOpenCriteriaDate
                            })}
                          >
                            {criteriaDateExpendOptions.map(option => (
                              <a
                                class={cx('dropdown-item', style.dropdownItem)}
                                key={option.value}
                                onClick={() => props.handleCriteriaDateChange(option.value)}
                              >
                                {option.label}
                              </a>
                            ))}
                          </div>
                          {(props.selectedCriteriaDate === 'previous' || props.selectedCriteriaDate === 'next') && (
                            <div class="d-flex flex-grow-1 min-width-200">
                              <input
                                type="number"
                                class="form-control mr-2"
                                placeholder="Interval"
                                value={props.boxOptions.interval}
                                onChange={props.handleIntervalChange}
                              />
                              <select
                                class="form-control"
                                value={props.boxOptions.intervalUnit}
                                onChange={props.handleIntervalUnitChange}
                              >
                                {intervalUnit.map(unit => (
                                  <option key={unit.value} value={unit.value}>
                                    {unit.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          {props.selectedCriteriaDate === 'current' && (
                            <div class="d-flex flex-grow-1 min-width-200">
                              <select
                                class="form-control"
                                value={props.tempBoxOptions.intervalUnit}
                                onChange={props.handleIntervalUnitChange}
                              >
                                {intervalUnit.map(unit => (
                                  <option key={unit.value} value={unit.value}>
                                    {unit.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          {props.selectedCriteriaDate === 'after' && (
                            <>
                              <div class="d-flex flex-column align-items-start">
                                <div class="mb-3 w-100">
                                  <label class="form-label" for="endDate">
                                    <Text id="dashboard.boxes.chart.criteria.criteriaDateBefore" />
                                  </label>
                                  <input
                                    type="date"
                                    id="beforeEndDate"
                                    class="form-control"
                                    value={
                                      props.tempBoxOptions.startDate
                                        ? new Date(props.tempBoxOptions.startDate).toISOString().split('T')[0]
                                        : ''
                                    }
                                    onInput={props.handleStartDateChange}
                                    about="beforeEndDate"
                                  />
                                </div>

                                <div class="mb-3 w-100">
                                  <label class="form-label" for="datePicker">
                                    <Text id="dashboard.boxes.chart.date" />
                                  </label>
                                  <DatePicker
                                    selected={props.tempBoxOptions.startDate}
                                    onChange={props.handleStartDateChange}
                                    className={cx('form-control')}
                                    inline
                                    // showTimeSelect
                                    timeFormat="HH:mm"
                                    timeIntervals={60}
                                    dateFormat="MMMM d, yyyy h:mm aa"
                                    timeCaption="Heure"
                                    maxDate={new Date()}
                                    minDate={new Date('1970-01-01T00:00:00Z')}
                                    showYearDropdown
                                    showMonthDropdown
                                  />
                                </div>
                              </div>
                            </>
                          )}
                          {props.selectedCriteriaDate === 'before' && (
                            <>
                              <div class="d-flex flex-column align-items-start">
                                <div class="mb-3 w-100">
                                  <label class="form-label" for="endDate">
                                    <Text id="dashboard.boxes.chart.criteria.criteriaDateBefore" />
                                  </label>
                                  <input
                                    type="date"
                                    id="beforeEndDate"
                                    class="form-control"
                                    value={
                                      props.tempBoxOptions.endDate
                                        ? new Date(props.tempBoxOptions.endDate).toISOString().split('T')[0]
                                        : ''
                                    }
                                    onInput={props.handleEndDateChange}
                                    about="beforeEndDate"
                                  />
                                </div>

                                <div class="mb-3 w-100">
                                  <label class="form-label" for="datePicker">
                                    <Text id="dashboard.boxes.chart.date" />
                                  </label>
                                  <DatePicker
                                    selected={props.tempBoxOptions.endDate}
                                    onChange={props.handleEndDateChange}
                                    className={cx('form-control')}
                                    inline
                                    // showTimeSelect
                                    timeFormat="HH:mm"
                                    timeIntervals={60}
                                    dateFormat="MMMM d, yyyy h:mm aa"
                                    timeCaption="Heure"
                                    maxDate={new Date()}
                                    minDate={new Date('1970-01-01T00:00:00Z')}
                                  />
                                </div>
                              </div>
                            </>
                          )}
                          {props.selectedCriteriaDate === 'between' && (
                            <>
                              <div class="d-flex flex-grow-1 min-width-200">
                                <input
                                  type="date"
                                  id="betweenStartDate"
                                  class="form-control"
                                  value={
                                    props.tempBoxOptions.startDate
                                      ? new Date(props.tempBoxOptions.startDate).toISOString().split('T')[0]
                                      : ''
                                  }
                                  onInput={props.handleStartDateChange}
                                  about="beforeEndDate"
                                  placeholder="date de début"
                                />
                                <input
                                  type="date"
                                  id="betweenEndDate"
                                  class="form-control"
                                  value={
                                    props.tempBoxOptions.endDate
                                      ? new Date(props.tempBoxOptions.endDate).toISOString().split('T')[0]
                                      : ''
                                  }
                                  onInput={props.handleEndDateChange}
                                  about="beforeEndDate"
                                  placeholder="date de fin"
                                />
                              </div>
                              <div class="d-flex flex-grow-1 min-width-200">
                                <div class={cx(style.datePicker, 'mr-2')}>
                                  <span class={style.datePickerLabel}>
                                    <Text id="dashboard.boxes.chart.date" />
                                  </span>
                                  <DatePicker
                                    selected={props.tempBoxOptions.startDate}
                                    onChange={props.handleStartDateChange}
                                    className={cx('form-control-start', style.datePickerInput)}
                                    inline
                                    showTimeSelect
                                    timeFormat="HH:mm"
                                    timeIntervals={60}
                                    dateFormat="yyyy-MM-dd HH:mm"
                                    timeCaption="time"
                                    maxDate={new Date()}
                                    minDate={new Date('1970-01-01T00:00:00Z')}
                                  />
                                </div>
                                <div class={cx(style.datePicker, 'mr-2')}>
                                  <span class={style.datePickerLabel}>
                                    <Text id="dashboard.boxes.chart.date" />
                                  </span>
                                  <DatePicker
                                    selected={props.tempBoxOptions.endDate}
                                    onChange={props.handleEndDateChange}
                                    className={cx('form-control-end', style.datePickerInput)}
                                    inline
                                    showTimeSelect
                                    timeFormat="HH:mm"
                                    timeIntervals={60}
                                    dateFormat="yyyy-MM-dd HH:mm"
                                    timeCaption="time"
                                    maxDate={new Date()}
                                    minDate={new Date('1970-01-01T00:00:00Z')}
                                  />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        <div class="mt-3">
                          <button class="btn btn-primary btn-block" onClick={props.applyAndClose}>
                            <Text id="dashboard.boxes.chart.criteria.applyAndClose" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <h5 class="mb-0 ml-5 mr-3">
                    <Text id="dashboard.boxes.chart.criteria.criteriaAggregateExpendOptionsTitle" />
                  </h5>
                  <div class={cx('dropdown', style.dropdownMenuUp, { show: props.dropdownOpenCriteriaAggregate })}>
                    <button
                      class="btn btn-secondary dropdown-toggle"
                      type="button"
                      onClick={props.toggleDropdownCriteriaAggregate}
                    >
                      {
                        criteriaAggregateExpendOptions.find(option => option.value === props.selectedCriteriaAggregate)
                          .label
                      }
                    </button>
                    <div
                      class={cx('dropdown-menu', style.dropdownMenuUp, { show: props.dropdownOpenCriteriaAggregate })}
                    >
                      {criteriaAggregateExpendOptions.map(option => (
                        <a
                          class={cx('dropdown-item', style.dropdownItem)}
                          key={option.value}
                          onClick={() => props.handleCriteriaAggregateChange(option.value)}
                        >
                          {option.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
                <div class={cx(style.displacementRaftersChart)}>
                  <button
                    class={cx('btn btn-outline-secondary mr-3', style.customBtnCommon, style.customBtn)}
                    onClick={props.handlePreviousDate}
                  >
                    <i class="fe fe-chevron-left" />
                  </button>
                  <button
                    class={cx('btn btn-outline-secondary', style.customBtnCommon, style.customBtn)}
                    onClick={props.handleNextDate}
                  >
                    <i class="fe fe-chevron-right" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

class ExpandedDashboardPage extends Component {
  toggleDropdownGlobal = () => {
    this.setState(prevState => ({
      dropdownOpenGlobal: !prevState.dropdownOpenGlobal
    }));
  };
  applyAndClose = () => {
    this.setState(prevState => ({
      dropdownOpenGlobal: false,
      boxOptions: {
        ...prevState.boxOptions,
        startDate: prevState.tempBoxOptions.startDate,
        endDate: prevState.tempBoxOptions.endDate,
        interval: prevState.tempBoxOptions.interval,
        intervalUnit: prevState.tempBoxOptions.intervalUnit
      }
    }));
  };
  toggleDropdownCriteriaDate = () => {
    this.setState(prevState => ({
      dropdownOpenCriteriaDate: !prevState.dropdownOpenCriteriaDate
    }));
  };
  handleIntervalUnitChange = event => {
    this.setState({ boxOptions: { ...this.state.boxOptions, intervalUnit: event.target.value } });
  };

  handleCriteriaDateChange = criteria => {
    this.setState({ selectedCriteriaDate: criteria, dropdownOpenCriteriaDate: false });
  };
  toggleDropdownCriteriaAggregate = () => {
    this.setState(prevState => ({
      dropdownOpenCriteriaAggregate: !prevState.dropdownOpenCriteriaAggregate
    }));
  };
  handleCriteriaAggregateChange = criteria => {
    this.setState({ selectedCriteriaAggregate: criteria, dropdownOpenCriteriaAggregate: false });
  };

  handleStartDateChange = e => {
    let date;
    if (e.target) {
      date = e.target.valueAsDate;
    } else {
      date = e;
    }
    this.setState(prevState => {
      const tempBoxOptions = prevState.tempBoxOptions;
      tempBoxOptions.startDate = new Date(date);
      return tempBoxOptions;
    });
  };

  handleEndDateChange = e => {
    let date;
    if (e.target) {
      date = e.target.valueAsDate;
    } else {
      date = e;
    }
    this.setState(prevState => {
      const tempBoxOptions = prevState.tempBoxOptions;
      tempBoxOptions.endDate = new Date(date);
      return tempBoxOptions;
    });
  };
  calculateNewDates = (startDate, endDate, interval, direction) => {
    let newStartDate, newEndDate;
    const multiplier = direction === 'previous' ? -1 : 1;

    if (startDate && !endDate) {
      newStartDate = new Date(startDate.getTime() + multiplier * interval * 60000);
      newEndDate = new Date(startDate.getTime());
    } else if (!startDate && endDate) {
      newStartDate = new Date(endDate.getTime() + multiplier * interval * 60000);
      newEndDate = new Date(endDate.getTime());
    } else if (!startDate && !endDate) {
      const now = new Date();

      newStartDate = new Date(now.getTime() + multiplier * interval * 60000 * 2);
      newEndDate = new Date(now.getTime() + multiplier * interval * 60000);
    } else {
      newStartDate = new Date(startDate.getTime() + multiplier * (endDate.getTime() - startDate.getTime()));
      newEndDate = new Date(endDate.getTime() + multiplier * (endDate.getTime() - startDate.getTime()));
    }

    return { newStartDate, newEndDate };
  };

  handlePreviousDate = () => {
    const { startDate, endDate, interval } = this.state.boxOptions;
    const { newStartDate, newEndDate } = this.calculateNewDates(startDate, endDate, interval, 'previous');

    this.setState(prevState => ({
      dropdownOpenGlobal: false,
      boxOptions: {
        ...prevState.boxOptions,
        startDate: newStartDate,
        endDate: newEndDate
      }
    }));
  };
  handleNextDate = () => {
    const { startDate, endDate, interval } = this.state.boxOptions;
    const { newStartDate, newEndDate } = this.calculateNewDates(startDate, endDate, interval, 'next');

    this.setState(prevState => ({
      dropdownOpenGlobal: false,
      boxOptions: {
        ...prevState.boxOptions,
        startDate: newStartDate,
        endDate: newEndDate
      }
    }));
  };

  handleIntervalChange = (newInterval, newIntervalUnit) => {
    this.setState(prevState => ({
      boxOptions: {
        ...prevState.boxOptions,
        interval: newInterval,
        intervalUnit: newIntervalUnit
      }
    }));
  };

  updateInterval = async () => {
    await this.setState({
      boxOptions: {
        ...this.state.boxOptions,
        interval: intervalByName[this.props.box.interval]
      },
      tempBoxOptions: {
        ...this.state.tempBoxOptions,
        interval: intervalByName[this.props.box.interval]
      }
    });
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      name: '',
      box: null,
      loading: true,
      x: props.x,
      y: props.y,
      boxOptions: {
        startDate: null,
        endDate: null,
        interval: props.box && props.box.interval ? intervalByName[props.box.interval] : ONE_HOUR_IN_MINUTES,
        intervalUnit: 'days'
      },
      tempBoxOptions: {
        startDate: null,
        endDate: null,
        interval: props.box && props.box.interval ? intervalByName[props.box.interval] : ONE_HOUR_IN_MINUTES,
        intervalUnit: 'days'
      },
      dropdownOpenCriteriaDate: false,
      dropdownOpenCriteriaAggregate: false,
      selectedGlobalOption: false,
      selectedCriteriaDate: 'before',
      selectedCriteriaAggregate: 'notAggregate'
    };
  }

  async initialize() {
    const { x, y, dashboardSelector } = this.props;
    const currentDashboard = await this.props.httpClient.get(`/api/v1/dashboard/${dashboardSelector}`);
    const box = currentDashboard.boxes[x][y];
    const name = currentDashboard.name;
    this.setState({ box, loading: false, name });
  }
  async componentDidMount() {
    // const { x, y, dashboardSelector } = this.props;
    // const currentDashboard = await this.props.httpClient.get(`/api/v1/dashboard/${dashboardSelector}`);
    // const box = currentDashboard.boxes[x][y];
    // const name = currentDashboard.name;
    // this.setState({ box, loading: false, name });
    this.initialize();
  }
  async componentDidUpdate(previousProps) {
    const intervalChanged = get(previousProps, 'box.interval') !== get(this.props, 'box.interval');
    if (intervalChanged) {
      await this.updateInterval(this.props.box.interval);
    }
  }

  render(
    props,
    {
      loading,
      boxOptions,
      tempBoxOptions,
      dropdownOpenGlobal,
      dropdownOpenCriteriaDate,
      dropdownOpenCriteriaAggregate,
      selectedCriteriaDate,
      selectedCriteriaAggregate
    }
  ) {
    if (!loading) {
      return (
        <ChartBoxExpanded
          {...props}
          loading={loading}
          boxOptions={boxOptions}
          tempBoxOptions={tempBoxOptions}
          dropdownOpenGlobal={dropdownOpenGlobal}
          dropdownOpenCriteriaDate={dropdownOpenCriteriaDate}
          dropdownOpenCriteriaAggregate={dropdownOpenCriteriaAggregate}
          selectedCriteriaDate={selectedCriteriaDate}
          selectedCriteriaAggregate={selectedCriteriaAggregate}
          handleStartDateChange={this.handleStartDateChange}
          handleEndDateChange={this.handleEndDateChange}
          handlePreviousDate={this.handlePreviousDate}
          handleNextDate={this.handleNextDate}
          handleIntervalChange={this.handleIntervalChange}
          handleCriteriaDateChange={this.handleCriteriaDateChange}
          handleCriteriaAggregateChange={this.handleCriteriaAggregateChange}
          toggleDropdownGlobal={this.toggleDropdownGlobal}
          toggleDropdownCriteriaDate={this.toggleDropdownCriteriaDate}
          toggleDropdownCriteriaAggregate={this.toggleDropdownCriteriaAggregate}
          handleIntervalUnitChange={this.handleIntervalUnitChange}
          applyAndClose={this.applyAndClose}
          box={this.state.box}
          name={this.state.name}
        />
      );
    }
  }
}

export default connect('user,httpClient', {})(ExpandedDashboardPage);
