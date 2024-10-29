import { Component } from 'preact';
import { connect } from 'unistore/preact';
import DatePicker from 'react-datepicker';
import get from 'get-value';
import { Text, Localizer } from 'preact-i18n';
import { format } from 'date-fns';
import Select from 'react-select';

import fr from 'date-fns/locale/fr';

import 'react-datepicker/dist/react-datepicker.css';

const DAYS_OF_THE_MONTH = new Array(31).fill(0, 0, 31).map((val, index) => index + 1);

class TurnOnLight extends Component {
  resetForm = () => {
    this.props.updateTriggerProperty(this.props.index, 'date', undefined);
    this.props.updateTriggerProperty(this.props.index, 'time', undefined);
    this.props.updateTriggerProperty(this.props.index, 'interval', undefined);
    this.props.updateTriggerProperty(this.props.index, 'unit', undefined);
    this.props.updateTriggerProperty(this.props.index, 'days_of_the_week', undefined);
    this.props.updateTriggerProperty(this.props.index, 'day_of_the_month', undefined);
  };
  handleTypeChange = e => {
    const schedulerType = e.target.value;
    this.props.updateTriggerProperty(this.props.index, 'scheduler_type', schedulerType);
    this.resetForm();
    if (schedulerType === 'every-month') {
      this.props.updateTriggerProperty(this.props.index, 'day_of_the_month', 1);
      this.props.updateTriggerProperty(this.props.index, 'time', '12:00');
    } else if (schedulerType === 'every-week') {
      this.props.updateTriggerProperty(this.props.index, 'days_of_the_week', [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday'
      ]);
      this.props.updateTriggerProperty(this.props.index, 'time', '12:00');
    } else if (schedulerType === 'every-day') {
      this.props.updateTriggerProperty(this.props.index, 'time', '12:00');
    } else if (schedulerType === 'custom-time') {
      let tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      this.props.updateTriggerProperty(this.props.index, 'time', '12:00');
      this.props.updateTriggerProperty(this.props.index, 'date', format(tomorrow, 'yyyy-MM-dd'));
    } else if (schedulerType === 'interval') {
      this.props.updateTriggerProperty(this.props.index, 'unit', 'second');
      this.props.updateTriggerProperty(this.props.index, 'interval', 30);
    }
  };
  handleDateChange = date => {
    this.props.updateTriggerProperty(this.props.index, 'date', format(date, 'yyyy-MM-dd'));
  };
  handleTimeChange = time => {
    this.props.updateTriggerProperty(this.props.index, 'time', format(time, 'HH:mm'));
  };
  handleIntervalChange = e => {
    if (!isNaN(parseInt(e.target.value, 10))) {
      this.props.updateTriggerProperty(this.props.index, 'interval', parseInt(e.target.value, 10));
    } else {
      this.props.updateTriggerProperty(this.props.index, 'interval', null);
    }
  };
  handleUnitChange = e => {
    this.props.updateTriggerProperty(this.props.index, 'unit', e.target.value);
  };
  handleDayOfTheWeekChange = options => {
    const values = options ? options.map(option => option.value) : [];
    this.props.updateTriggerProperty(this.props.index, 'days_of_the_week', values);
  };
  handleDayOfTheMonthChange = e => {
    this.props.updateTriggerProperty(this.props.index, 'day_of_the_month', e.target.value);
  };

  render({}, {}) {
    const language = get(this.props, 'user.language');
    const localeSet = language === 'fr' ? fr : 'en';
    const time = this.props.trigger.time
      ? new Date().setHours(this.props.trigger.time.substr(0, 2), this.props.trigger.time.substr(3, 2))
      : null;
    const selectedWeekDaysOptions = this.props.trigger.days_of_the_week
      ? this.props.trigger.days_of_the_week.map(day => ({
          value: day,
          label: <Text id={`editScene.triggersCard.scheduledTrigger.daysOfTheWeek.${day}`} />
        }))
      : [];
    const date = this.props.trigger.date ? new Date(this.props.trigger.date) : null;
    return (
      <div>
        <div class="row">
          <div class="col-sm-6">
            <div class="form-group">
              <div class="form-label">
                <Text id="editScene.triggersCard.scheduledTrigger.typeLabel" />
              </div>
              <select class="form-control" onChange={this.handleTypeChange} value={this.props.trigger.scheduler_type}>
                <option>
                  <Text id="global.emptySelectOption" />
                </option>
                <option value="every-month">
                  <Text id="editScene.triggersCard.scheduledTrigger.everyMonth" />
                </option>
                <option value="every-week">
                  <Text id="editScene.triggersCard.scheduledTrigger.everyWeek" />
                </option>
                <option value="every-day">
                  <Text id="editScene.triggersCard.scheduledTrigger.everyDay" />
                </option>
                <option value="interval">
                  <Text id="editScene.triggersCard.scheduledTrigger.interval" />
                </option>
                <option value="custom-time">
                  <Text id="editScene.triggersCard.scheduledTrigger.customTime" />
                </option>
              </select>
            </div>
          </div>
          {this.props.trigger.scheduler_type === 'custom-time' && (
            <div class="col-sm-4">
              <div class="form-group">
                <div class="form-label">
                  <Text id="editScene.triggersCard.scheduledTrigger.dateLabel" />
                </div>
                <Localizer>
                  <DatePicker
                    selected={date}
                    className="form-control"
                    placeholderText={<Text id="editScene.triggersCard.scheduledTrigger.dateLabel" />}
                    locale={localeSet}
                    onChange={this.handleDateChange}
                    dateFormat={<Text id="editScene.triggersCard.scheduledTrigger.dateFormat" />}
                  />
                </Localizer>
              </div>
            </div>
          )}
          {this.props.trigger.scheduler_type === 'custom-time' && (
            <div class="col-sm-4">
              <div class="form-group">
                <div class="form-label">
                  <Text id="editScene.triggersCard.scheduledTrigger.timeLabel" />
                </div>
                <Localizer>
                  <DatePicker
                    selected={time}
                    className="form-control"
                    locale={localeSet}
                    onChange={this.handleTimeChange}
                    placeholderText={<Text id="editScene.triggersCard.scheduledTrigger.timeCaption" />}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={5}
                    timeCaption={<Text id="editScene.triggersCard.scheduledTrigger.timeCaption" />}
                    dateFormat="HH:mm"
                  />
                </Localizer>
              </div>
            </div>
          )}
          {this.props.trigger.scheduler_type === 'interval' && (
            <div class="col-sm-4">
              <div class="form-group">
                <div class="form-label">
                  <Text id="editScene.triggersCard.scheduledTrigger.intervalLabel" />
                </div>
                <Localizer>
                  <input
                    type="text"
                    class="form-control"
                    value={this.props.trigger.interval}
                    onChange={this.handleIntervalChange}
                    placeholder={<Text id="editScene.triggersCard.scheduledTrigger.intervalLabel" />}
                  />
                </Localizer>
              </div>
            </div>
          )}
          {this.props.trigger.scheduler_type === 'interval' && (
            <div class="col-sm-4">
              <div class="form-group">
                <div class="form-label">
                  <Text id="editScene.triggersCard.scheduledTrigger.unitLabel" />
                </div>
                <select class="form-control" value={this.props.trigger.unit} onChange={this.handleUnitChange}>
                  <option value="second">
                    <Text id="editScene.triggersCard.scheduledTrigger.units.second" />
                  </option>
                  <option value="minute">
                    <Text id="editScene.triggersCard.scheduledTrigger.units.minute" />
                  </option>
                  <option value="hour">
                    <Text id="editScene.triggersCard.scheduledTrigger.units.hour" />
                  </option>
                </select>
              </div>
            </div>
          )}
          {this.props.trigger.scheduler_type === 'every-day' && (
            <div class="col-sm-4">
              <div class="form-group">
                <div class="form-label">
                  <Text id="editScene.triggersCard.scheduledTrigger.timeLabel" />
                </div>
                <Localizer>
                  <DatePicker
                    selected={time}
                    className="form-control"
                    locale={localeSet}
                    onChange={this.handleTimeChange}
                    placeholderText={<Text id="editScene.triggersCard.scheduledTrigger.timeCaption" />}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={5}
                    timeCaption={<Text id="editScene.triggersCard.scheduledTrigger.timeCaption" />}
                    dateFormat="HH:mm"
                  />
                </Localizer>
              </div>
            </div>
          )}
          {this.props.trigger.scheduler_type === 'every-week' && (
            <div class="col-sm-12">
              <div class="form-group">
                <div class="form-label">
                  <Text id="editScene.triggersCard.scheduledTrigger.daysOfTheWeekLabel" />
                </div>
                <Select
                  defaultValue={[]}
                  isMulti
                  value={selectedWeekDaysOptions}
                  onChange={this.handleDayOfTheWeekChange}
                  options={[
                    {
                      value: 'monday',
                      label: <Text id="editScene.triggersCard.scheduledTrigger.daysOfTheWeek.monday" />
                    },
                    {
                      value: 'tuesday',
                      label: <Text id="editScene.triggersCard.scheduledTrigger.daysOfTheWeek.tuesday" />
                    },
                    {
                      value: 'wednesday',
                      label: <Text id="editScene.triggersCard.scheduledTrigger.daysOfTheWeek.wednesday" />
                    },
                    {
                      value: 'thursday',
                      label: <Text id="editScene.triggersCard.scheduledTrigger.daysOfTheWeek.thursday" />
                    },
                    {
                      value: 'friday',
                      label: <Text id="editScene.triggersCard.scheduledTrigger.daysOfTheWeek.friday" />
                    },
                    {
                      value: 'saturday',
                      label: <Text id="editScene.triggersCard.scheduledTrigger.daysOfTheWeek.saturday" />
                    },
                    {
                      value: 'sunday',
                      label: <Text id="editScene.triggersCard.scheduledTrigger.daysOfTheWeek.sunday" />
                    }
                  ]}
                />
              </div>
            </div>
          )}
          {this.props.trigger.scheduler_type === 'every-week' && (
            <div class="col-sm-4">
              <div class="form-group">
                <div class="form-label">
                  <Text id="editScene.triggersCard.scheduledTrigger.timeLabel" />
                </div>
                <Localizer>
                  <DatePicker
                    selected={time}
                    className="form-control"
                    locale={localeSet}
                    onChange={this.handleTimeChange}
                    placeholderText={<Text id="editScene.triggersCard.scheduledTrigger.timeCaption" />}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={5}
                    timeCaption={<Text id="editScene.triggersCard.scheduledTrigger.timeCaption" />}
                    dateFormat="HH:mm"
                  />
                </Localizer>
              </div>
            </div>
          )}
          {this.props.trigger.scheduler_type === 'every-month' && (
            <div class="col-sm-4">
              <div class="form-group">
                <div class="form-label">
                  <Text id="editScene.triggersCard.scheduledTrigger.dayOfTheMonthLabel" />
                </div>
                <select
                  class="form-control"
                  value={this.props.trigger.day_of_the_month}
                  onChange={this.handleDayOfTheMonthChange}
                >
                  {DAYS_OF_THE_MONTH.map(value => (
                    <option value={value}>{value}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {this.props.trigger.scheduler_type === 'every-month' && (
            <div class="col-sm-4">
              <div class="form-group">
                <div class="form-label">
                  <Text id="editScene.triggersCard.scheduledTrigger.timeLabel" />
                </div>
                <Localizer>
                  <DatePicker
                    selected={time}
                    className="form-control"
                    locale={localeSet}
                    onChange={this.handleTimeChange}
                    placeholderText={<Text id="editScene.triggersCard.scheduledTrigger.timeCaption" />}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={5}
                    timeCaption={<Text id="editScene.triggersCard.scheduledTrigger.timeCaption" />}
                    dateFormat="HH:mm"
                  />
                </Localizer>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default connect('httpClient,user', {})(TurnOnLight);
