import Select from 'react-select';
import { Component } from 'preact';
import DatePicker from 'react-datepicker';
import { connect } from 'unistore/preact';
import { format } from 'date-fns';
import { Text, Localizer } from 'preact-i18n';
import get from 'get-value';

import 'react-datepicker/dist/react-datepicker.css';
import style from './CheckTime.css';

import fr from 'date-fns/locale/fr';

const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

class CheckTime extends Component {
  handleBeforeTimeChange = time => {
    const timeFormatted = time ? format(time, 'HH:mm') : undefined;
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'before', timeFormatted);
  };
  handleBeforeAfterChange = time => {
    const timeFormatted = time ? format(time, 'HH:mm') : undefined;
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'after', timeFormatted);
  };
  handleDayOfTheWeekChange = options => {
    const values = options ? options.map(option => option.value) : undefined;
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'days_of_the_week', values);
  };

  render() {
    const language = get(this.props, 'user.language');
    const localeSet = language === 'fr' ? fr : 'en';
    const before = this.props.action.before
      ? new Date().setHours(this.props.action.before.substr(0, 2), this.props.action.before.substr(3, 2))
      : null;
    const after = this.props.action.after
      ? new Date().setHours(this.props.action.after.substr(0, 2), this.props.action.after.substr(3, 2))
      : null;
    const daysOfTheWeekOptions = weekDays.map(weekDay => ({
      value: weekDay,
      label: <Text id={`editScene.triggersCard.scheduledTrigger.daysOfTheWeek.${weekDay}`} />
    }));
    const selectedWeekDaysOptions = this.props.action.days_of_the_week
      ? this.props.action.days_of_the_week.map(day => daysOfTheWeekOptions.find(option => option.value === day))
      : [];
    return (
      <div>
        <p>
          <small>
            <Text id="editScene.actionsCard.checkTime.description" />
          </small>
        </p>
        <div class="row">
          <div class="col">
            <div class="form-group">
              <div class="form-label">
                <Text id="editScene.actionsCard.checkTime.afterLabel" />
              </div>
              <Localizer>
                <DatePicker
                  selected={after}
                  className="form-control"
                  clearButtonClassName={style.clearButtonCustom}
                  locale={localeSet}
                  onChange={this.handleBeforeAfterChange}
                  placeholderText={<Text id="editScene.actionsCard.checkTime.afterLabel" />}
                  showTimeSelect
                  showTimeSelectOnly
                  isClearable
                  timeIntervals={5}
                  timeCaption={<Text id="editScene.actionsCard.checkTime.afterLabel" />}
                  dateFormat="HH:mm"
                />
              </Localizer>
            </div>
          </div>
          <div class="col">
            <div class="form-group">
              <div class="form-label">
                <Text id="editScene.actionsCard.checkTime.beforeLabel" />
              </div>
              <Localizer>
                <DatePicker
                  selected={before}
                  className="form-control"
                  clearButtonClassName={style.clearButtonCustom}
                  locale={localeSet}
                  onChange={this.handleBeforeTimeChange}
                  placeholderText={<Text id="editScene.actionsCard.checkTime.beforeLabel" />}
                  showTimeSelect
                  showTimeSelectOnly
                  isClearable
                  timeIntervals={5}
                  timeCaption={<Text id="editScene.actionsCard.checkTime.beforeLabel" />}
                  dateFormat="HH:mm"
                />
              </Localizer>
            </div>
          </div>
        </div>
        <div class="form-group">
          <div class="form-label">
            <Text id="editScene.actionsCard.checkTime.daysOfTheWeekLabel" />
          </div>
          <Select
            defaultValue={[]}
            isMulti
            value={selectedWeekDaysOptions}
            onChange={this.handleDayOfTheWeekChange}
            options={daysOfTheWeekOptions}
          />
        </div>
      </div>
    );
  }
}

export default connect('user', {})(CheckTime);
