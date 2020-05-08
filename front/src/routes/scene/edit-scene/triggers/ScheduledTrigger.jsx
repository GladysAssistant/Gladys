import { Component } from 'preact';
import { connect } from 'unistore/preact';
import DatePicker from 'react-datepicker';
import get from 'get-value';
import { Text, Localizer } from 'preact-i18n';
import { format } from 'date-fns';
import Select from '../../../../components/form/Select';

import fr from 'date-fns/locale/fr';

import 'react-datepicker/dist/react-datepicker.css';

const DAYS_OF_THE_MONTH = new Array(31).fill(0, 0, 31).map((val, index) => index + 1);

@connect('httpClient,user', {})
class TurnOnLight extends Component {
  resetForm = () => {
    this.props.updateTriggerProperty(this.props.index, 'date', undefined);
    this.props.updateTriggerProperty(this.props.index, 'time', undefined);
    this.props.updateTriggerProperty(this.props.index, 'interval', undefined);
    this.props.updateTriggerProperty(this.props.index, 'unit', undefined);
    this.props.updateTriggerProperty(this.props.index, 'days_of_the_week', undefined);
    this.props.updateTriggerProperty(this.props.index, 'day_of_the_month', undefined);
  };
  handleTypeChange = type => {
    const schedulerType = type.value;
    this.props.updateTriggerProperty(this.props.index, 'scheduler_type', schedulerType);
    this.resetForm();
    if (schedulerType === 'every-month') {
      this.props.updateTriggerProperty(this.props.index, 'day_of_the_month', 1);
    } else if (schedulerType === 'every-week') {
      this.props.updateTriggerProperty(this.props.index, 'days_of_the_week', []);
    } else if (schedulerType === 'interval') {
      this.props.updateTriggerProperty(this.props.index, 'unit', 'second');
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
  handleUnitChange = unit => {
    this.props.updateTriggerProperty(this.props.index, 'unit', unit.value);
  };
  handleDayOfTheWeekChange = options => {
    const values = options ? options.map(option => option.value) : [];
    this.props.updateTriggerProperty(this.props.index, 'days_of_the_week', values);
  };
  handleDayOfTheMonthChange = value => {
    this.props.updateTriggerProperty(this.props.index, 'day_of_the_month', value);
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
          <div class="col-sm-4">
            <div class="form-group">
              <div class="form-label">
                <Text id="editScene.triggersCard.scheduledTrigger.typeLabel" />
              </div>
              <Select
                onChange={this.handleTypeChange}
                value={this.props.trigger.scheduler_type}
                uniqueKey="value"
                options={[
                  {
                    value: 'every-month',
                    label: <Text id="editScene.triggersCard.scheduledTrigger.everyMonth" />
                  },
                  {
                    value: 'every-week',
                    label: <Text id="editScene.triggersCard.scheduledTrigger.everyWeek" />
                  },
                  {
                    value: 'every-day',
                    label: <Text id="editScene.triggersCard.scheduledTrigger.everyDay" />
                  },
                  {
                    value: 'interval',
                    label: <Text id="editScene.triggersCard.scheduledTrigger.interval" />
                  },
                  {
                    value: 'custom-time',
                    label: <Text id="editScene.triggersCard.scheduledTrigger.customTime" />
                  }
                ]}
              />
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
                <Select
                  value={this.props.trigger.unit}
                  onChange={this.handleUnitChange}
                  uniqueKey="value"
                  options={[
                    {
                      value: 'second',
                      label: <Text id="editScene.triggersCard.scheduledTrigger.units.second" />
                    },
                    {
                      value: 'minute',
                      label: <Text id="editScene.triggersCard.scheduledTrigger.units.minute" />
                    },
                    {
                      value: 'hour',
                      label: <Text id="editScene.triggersCard.scheduledTrigger.units.hour" />
                    }
                  ]}
                />
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
                  multiple
                  searchable
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
                  uniqueKey="value"
                />
              </div>
            </div>
          )}
          {this.props.trigger.scheduler_type === 'every-week' && (
            <div class="col-sm-2">
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
                <Select
                  value={this.props.trigger.day_of_the_month}
                  onChange={this.handleDayOfTheMonthChange}
                  options={DAYS_OF_THE_MONTH}
                />
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

export default TurnOnLight;
