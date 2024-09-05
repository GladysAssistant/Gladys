import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import style from './style.css';
import Chart from '../../../components/boxs/chart/Chart';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { useState } from 'preact/hooks';

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
    {console.log('props ChartBoxExpanded', props)}
    {console.log('children ChartBoxExpanded', children)}
    {console.log('this ChartBoxExpanded', this)}
    <div class="row rows-lg-1">
    </div>
    <div class="row">
      <div class="col mx-auto">
        <div class="card">
          <div class={props.loading ? 'dimmer active' : 'dimmer'}>
            <div class="loader" />
            <div class="dimmer-content">
              <div class="card-body p-5">
                <div class="card-title d-flex align-items-center">
                  <Link href={`/dashboard/${props.dashboardSelector}`} class="btn btn-secondary btn-ml mr-3">
                    <i class="fe fe-chevron-left"></i>
                  </Link>
                  <h3 class="mb-0">
                    {props.name} - {props.box.title}
                  </h3>
                </div>
                {/* Future description ? */}
                {/* <p>
                  <Text id="newDashboard.description" />
                </p> */}
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
                {/* Futures options */}
                {/* <div class="form-group">
                  <label class="form-label">
                    <Text id="newDashboard.nameLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="text"
                      class={cx('form-control', {
                        'is-invalid': props.dashboardAlreadyExistError || props.unknownError
                      })}
                      placeholder={<Text id="newDashboard.nameLabel" />}
                      value={props.name}
                      onInput={props.updateName}
                    />
                  </Localizer>
                </div> */}
                <Chart
                  {...props}
                  showHistoryExpanded={true}
                  showCloseButton={true}
                  startDate={props.boxOptions.startDate}
                  endDate={props.boxOptions.endDate}
                />
                {/* Future options / Boutons */}
                {/* <div class="form-footer">
                  <button onClick={props.createDashboard} class="btn btn-primary btn-block">
                    <Text id="newDashboard.createDashboardButton" />
                  </button>
                </div> */}
              </div>
              <div class={cx(style.cardFooter, 'pl-5 pr-5 d-flex align-items-center justify-content-between')}>
                <div class={cx('d-flex align-items-center', style.flexContainer)}>
                  <h5 class="mb-0 mr-3">
                    <Text id="dashboard.boxes.chart.criteria.criteriaDateExpendOptionsTitle" />
                  </h5>
                  {console.log('props.dropdownOpenGlobal', props.dropdownOpenGlobal)}
                  <div class={cx('btn-group dropup', style.dropdownMenuUp, { 'show': props.dropdownOpenGlobal })}>
                    <Localizer>
                      <button class="btn btn-secondary dropdown-toggle" type="button" onClick={props.toggleDropdownGlobal}>
                        {props.selectedCriteriaDate === 'all' ?
                          <Text id="dashboard.boxes.chart.criteria.date.all" /> :
                          props.selectedCriteriaDate === 'previous' || props.selectedCriteriaDate === 'next' || props.selectedCriteriaDate === 'current' ?
                            <span>
                              {criteriaDateExpendOptions.find(option => option.value === props.selectedCriteriaDate).label}
                              {` ${props.boxOptions.interval}`}
                              {intervalUnit.find(option => option.value === props.boxOptions.intervalUnit).label}
                            </span> :

                            props.selectedCriteriaDate === 'current' ?
                              intervalUnitCurrent.find(option => option.value === props.boxOptions.intervalUnit).label :
                              props.selectedCriteriaDate === 'next' ?
                                <Text id="dashboard.boxes.chart.criteria.date.next" /> :
                                props.selectedCriteriaDate === 'before' ?
                                  <Text id="dashboard.boxes.chart.criteria.date.before" /> :
                                  props.selectedCriteriaDate === 'after' ?
                                    <Text id="dashboard.boxes.chart.criteria.date.after" /> :
                                    props.selectedCriteriaDate === 'between' ?
                                      <Text id="dashboard.boxes.chart.criteria.date.between" /> :
                                      props.selectedCriteriaDate === 'custom' ?
                                        <Text id="dashboard.boxes.chart.criteria.date.custom" /> :
                                        criteriaDateExpendOptions.find(option => option.value === props.selectedCriteriaDate).label
                        }
                      </button>
                    </Localizer>
                    {props.dropdownOpenGlobal && (
                      <div class={cx('dropdown-menu d-flex flex-column', style.dropdownMenuDown, 'p-3')}>
                        <div class={cx('dropdown', { 'show': props.dropdownOpenCriteriaDate })}>
                          <button class="btn btn-secondary btn-block align-items-center mb-2" type="button" onClick={props.toggleDropdownCriteriaDate}>
                            <span class="text-left">
                              {criteriaDateExpendOptions.find(option => option.value === props.selectedCriteriaDate).label}
                            </span>
                            <span class="text-right">
                              <i class="fe fe-chevron-down"></i>
                            </span>
                          </button>
                          <div class={cx('dropdown-menu', style.dropdownMenuDown, { 'show': props.dropdownOpenCriteriaDate })}>
                            {criteriaDateExpendOptions.map(option => (
                              <a class={cx('dropdown-item', style.dropdownItem)} key={option.value} onClick={() => props.handleCriteriaDateChange(option.value)}>
                                {option.label}
                              </a>
                            ))}
                          </div>
                          {(props.selectedCriteriaDate === 'previous' || props.selectedCriteriaDate === 'next') &&
                            <div class="d-flex flex-grow-1 min-width-200">
                              <input type="number" class="form-control mr-2" placeholder="Interval" value={props.boxOptions.interval} onChange={props.handleIntervalChange} />
                              <select class="form-control" value={props.boxOptions.intervalUnit} onChange={props.handleIntervalUnitChange}>
                                {intervalUnit.map(unit => (
                                  <option key={unit.value} value={unit.value}>{unit.label}</option>
                                ))}
                              </select>
                            </div>
                          }
                          {(props.selectedCriteriaDate === 'current') &&
                            <div class="d-flex flex-grow-1 min-width-200">
                              <select class="form-control" value={props.tempBoxOptions.intervalUnit} onChange={props.handleIntervalUnitChange}>
                                {intervalUnit.map(unit => (
                                  <option key={unit.value} value={unit.value}>{unit.label}</option>
                                ))}
                              </select>
                            </div>
                          }
                          {(props.selectedCriteriaDate === 'before') &&
                            <>
                              <div class="d-flex flex-column align-items-start">
                                <div class="mb-3 w-100">
                                  <label class="form-label" for="endDate">
                                    <Text id="dashboard.boxes.chart.criteria.criteriaDateBefore" />
                                  </label>
                                  <input
                                    type="date"
                                    id="endDate"
                                    class="form-control"
                                    value={props.tempBoxOptions.endDate}
                                    onInput={props.handleEndDateChange}
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
                                    timeIntervals={30}
                                    dateFormat="MMMM d, yyyy h:mm aa"
                                    timeCaption="Heure"
                                    maxDate={new Date()}
                                    minDate={new Date('1970-01-01T00:00:00Z')}
                                  />
                                </div>
                              </div>
                            </>
                          }
                          {(props.selectedCriteriaDate === 'between') &&
                            <>
                              <div class="d-flex flex-grow-1 min-width-200">
                                <input type="date" class="form-control mr-2" placeholder="date de début" value={props.tempBoxOptions.startDate} onChange={props.handleStartDateChange} />
                                <input type="date" class="form-control mr-2" placeholder="date de fin" value={props.tempBoxOptions.endDate} onChange={props.handleEndDateChange} />
                              </div>
                              <div class="d-flex flex-grow-1 min-width-200">
                                <div class={cx(style.datePicker, 'mr-2')}>
                                  <span class={style.datePickerLabel}>
                                    <Text id="dashboard.boxes.chart.date" />
                                  </span>
                                  <DatePicker
                                    selected={props.tempBoxOptions.startDate}
                                    onChange={props.handleStartDateChange}
                                    className={cx('form-control', style.datePickerInput)}
                                    showTimeSelect
                                    timeFormat="HH:mm"
                                    timeIntervals={30}
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
                                    selected={props.tempBoxOptions.startDate}
                                    onChange={props.handleStartDateChange}
                                    className={cx('form-control', style.datePickerInput)}
                                    showTimeSelect
                                    timeFormat="HH:mm"
                                    timeIntervals={30}
                                    dateFormat="yyyy-MM-dd HH:mm"
                                    timeCaption="time"
                                    maxDate={new Date()}
                                    minDate={new Date('1970-01-01T00:00:00Z')}
                                  />
                                </div>
                              </div>
                            </>
                          }

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
                  <div class={cx('dropdown', style.dropdownMenuUp, { 'show': props.dropdownOpenCriteriaAggregate })}>
                    <button class="btn btn-secondary dropdown-toggle" type="button" onClick={props.toggleDropdownCriteriaAggregate}>
                      {criteriaAggregateExpendOptions.find(option => option.value === props.selectedCriteriaAggregate).label}
                    </button>
                    <div class={cx('dropdown-menu', style.dropdownMenuUp, { 'show': props.dropdownOpenCriteriaAggregate })}>
                      {criteriaAggregateExpendOptions.map(option => (
                        <a class={cx('dropdown-item', style.dropdownItem)} key={option.value} onClick={() => props.handleCriteriaAggregateChange(option.value)}>
                          {option.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
                <div class={cx(style.displacementRaftersChart)}>
                  <button class={cx('btn btn-outline-secondary mr-3', style.customBtnCommon, style.customBtn)} onClick={props.handlePreviousDate}>
                    <i class="fe fe-chevron-left" />
                  </button>
                  <button class={cx('btn btn-outline-secondary', style.customBtnCommon, style.customBtn)} onClick={props.handleNextDate}>
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
    console.log('applyAndClose');
    this.setState(prevState => ({
      dropdownOpenGlobal: false,
      boxOptions: {
        ...prevState.boxOptions,
        startDate: prevState.tempBoxOptions.startDate,
        endDate: prevState.tempBoxOptions.endDate,
        interval: prevState.tempBoxOptions.interval,
        intervalUnit: prevState.tempBoxOptions.intervalUnit
      },
    }));
    // Logique supplémentaire si besoin, comme l'appel à une fonction pour appliquer les critères sélectionnés.
  };
  toggleDropdownCriteriaDate = () => {
    this.setState(prevState => ({
      dropdownOpenCriteriaDate: !prevState.dropdownOpenCriteriaDate
    }));
  };
  handleIntervalUnitChange = (event) => {
    console.log('handleIntervalUnitChange', event.target.value);
    this.setState({ boxOptions: { ...this.state.boxOptions, intervalUnit: event.target.value } });
  };

  handleCriteriaDateChange = (criteria) => {
    this.setState({ selectedCriteriaDate: criteria, dropdownOpenCriteriaDate: false });
  };
  toggleDropdownCriteriaAggregate = () => {
    this.setState(prevState => ({
      dropdownOpenCriteriaAggregate: !prevState.dropdownOpenCriteriaAggregate
    }));
  };
  handleCriteriaAggregateChange = (criteria) => {
    this.setState({ selectedCriteriaAggregate: criteria, dropdownOpenCriteriaAggregate: false });
  };

  handleStartDateChange = (e) => {
    let date;
    if (e.target) {
      date = e.target.valueAsDate;
    } else {
      date = e;
    }
    console.log('handleStartDateChange', date);
    this.setState(prevState => {
      const tempBoxOptions = prevState.tempBoxOptions;
      tempBoxOptions.startDate = new Date(date);
      return tempBoxOptions;
      if (prevState.tempBoxOptions.endDate) {
        const newEndDate = prevState.tempBoxOptions.endDate || new Date(date.getTime() + prevState.tempBoxOptions.interval * 60000);
        return {
          startDate: date,
          endDate: newEndDate < date ? date : newEndDate
        };
      }
      return {
        startDate: date,
        endDate: new Date()
      };
    });
  };

  handleEndDateChange = (e) => {
    let date;
    if (e.target) {
      date = e.target.valueAsDate;
    } else {
      date = e;
    }
    console.log('handleEndDateChange', date);
    this.setState(prevState => {
      const tempBoxOptions = prevState.tempBoxOptions;
      tempBoxOptions.endDate = new Date(date);
      return tempBoxOptions;
      if (boxOptions.startDate) {
        const newStartDate = boxOptions.startDate || new Date(date.getTime() - boxOptions.interval * 60000);

        return {
          endDate: date,
          startDate: newStartDate > date ? date : newStartDate
        };
      }
      return {
        endDate: date
      };
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
      newStartDate = new Date(Date.now() + multiplier * interval * 60000 * 2);
      newEndDate = new Date(Date.now() + multiplier * interval * 60000);
    } else {
      newStartDate = new Date(startDate.getTime() + multiplier * (endDate.getTime() - startDate.getTime()));
      newEndDate = new Date(endDate.getTime() + multiplier * (endDate.getTime() - startDate.getTime()));
    }

    return { newStartDate, newEndDate };
  };

  handlePreviousDate = () => {
    const { startDate, endDate, interval } = this.state;
    const { newStartDate, newEndDate } = this.calculateNewDates(startDate, endDate, interval, 'previous');
    this.setState(
      {
        startDate: newStartDate,
        endDate: newEndDate
      },
      this.getData
    );
  };
  handleNextDate = () => {
    const { startDate, endDate, interval } = this.state;
    const { newStartDate, newEndDate } = this.calculateNewDates(startDate, endDate, interval, 'next');
    this.setState(
      {
        startDate: newStartDate,
        endDate: newEndDate
      },
      this.getData
    );
  };
  constructor(props) {
    console.log('constructor props', props);
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
        interval: 30,
        intervalUnit: 'days'
      },
      tempBoxOptions: {
        startDate: null,
        endDate: null,
        interval: 30,
        intervalUnit: 'days'
      },
      dropdownOpenCriteriaDate: false,
      dropdownOpenCriteriaAggregate: false,
      selectedGlobalOption: false,
      selectedCriteriaDate: 'before',
      selectedCriteriaAggregate: 'notAggregate'
    };
    console.log('this.state', this.state);
  }

  async componentDidMount() {
    const { x, y, dashboardSelector } = this.props;
    const currentDashboard = await this.props.httpClient.get(
      `/api/v1/dashboard/${dashboardSelector}`
    );
    const box = currentDashboard.boxes[x][y];
    const name = currentDashboard.name;
    this.setState({ box, loading: false, name });
  }
  render(props, { loading,
    boxOptions,
    tempBoxOptions,
    dropdownOpenGlobal,
    dropdownOpenCriteriaDate,
    dropdownOpenCriteriaAggregate,
    selectedCriteriaDate,
    selectedCriteriaAggregate
  }) {
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
          handleCriteriaDateChange={this.handleCriteriaDateChange}
          handleCriteriaAggregateChange={this.handleCriteriaAggregateChange}
          toggleDropdownGlobal={this.toggleDropdownGlobal}
          toggleDropdownCriteriaDate={this.toggleDropdownCriteriaDate}
          toggleDropdownCriteriaAggregate={this.toggleDropdownCriteriaAggregate}
          handleIntervalUnitChange={this.handleIntervalUnitChange}
          handleIntervalChange={this.handleIntervalChange}
          applyAndClose={this.applyAndClose}
          box={this.state.box}
          name={this.state.name}
        />

      );
    }
  }
}

export default connect('user,httpClient', {})(ExpandedDashboardPage);
