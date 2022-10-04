import { Component } from 'preact';
import { connect } from 'unistore/preact';

import cx from 'classnames';
import get from 'get-value';
import { Text, Localizer } from 'preact-i18n';
import { RequestStatus } from '../../../../utils/consts';
import Select from 'react-select';
import withIntlAsProp from '../../../../utils/withIntlAsProp';

import style from './style.css';

const isNullOrUndefined = variable => variable === null || variable === undefined;

class CalendarEventIsComing extends Component {
  getCalendars = async () => {
    this.setState({
      status: RequestStatus.Getting
    });
    try {
      const calendars = await this.props.httpClient.get('/api/v1/calendar', {
        shared: true
      });
      const calendarsOptions = calendars.map(calendar => ({
        value: calendar.selector,
        label: calendar.name
      }));
      await this.setState({
        calendarsOptions,
        status: RequestStatus.Success
      });
      this.refreshSelectedOptions(this.props.trigger);
    } catch (e) {
      this.setState({
        status: RequestStatus.Error
      });
    }
  };
  updateCalendars = selectedCalendarsOptions => {
    const calendars = selectedCalendarsOptions.map(o => o.value);
    this.props.updateTriggerProperty(this.props.index, 'calendars', calendars);
  };
  handleComparator = e => {
    if (e.target.value) {
      this.props.updateTriggerProperty(this.props.index, 'calendar_event_name_comparator', e.target.value);
    } else {
      this.props.updateTriggerProperty(this.props.index, 'calendar_event_name_comparator', null);
    }
  };
  handleCalendarEventAttributeChange = e => {
    if (e.target.value) {
      this.props.updateTriggerProperty(this.props.index, 'calendar_event_attribute', e.target.value);
    } else {
      this.props.updateTriggerProperty(this.props.index, 'calendar_event_attribute', 'start');
    }
  };
  handleUnitChange = e => {
    if (e.target.value) {
      this.props.updateTriggerProperty(this.props.index, 'unit', e.target.value);
    } else {
      this.props.updateTriggerProperty(this.props.index, 'unit', 'minute');
    }
  };
  handleNameChange = e => {
    this.props.updateTriggerProperty(this.props.index, 'calendar_event_name', e.target.value);
  };
  handleDurationChange = e => {
    const value = e.target.value;
    if (!isNaN(parseInt(value, 10))) {
      this.props.updateTriggerProperty(this.props.index, 'duration', parseInt(value, 10));
    } else {
      this.props.updateTriggerProperty(this.props.index, 'duration', 0);
    }
  };
  refreshSelectedOptions = trigger => {
    const selectedCalendarsOptions = [];
    if (trigger.calendars && this.state.calendarsOptions) {
      trigger.calendars.forEach(calendar => {
        const calendarOption = this.state.calendarsOptions.find(calendarOption => calendarOption.value === calendar);
        if (calendarOption) {
          selectedCalendarsOptions.push(calendarOption);
        }
      });
    }
    this.setState({ selectedCalendarsOptions });
  };

  setVariables = () => {
    const EVENT_NAME_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.calendar.eventName');
    const EVENT_LOCATION_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.calendar.eventLocation');
    const EVENT_DESCRIPTION_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.calendar.eventDescription');
    const EVENT_START_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.calendar.eventStart');
    const EVENT_END_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.calendar.eventEnd');
    this.props.setVariablesTrigger(this.props.index, [
      {
        name: 'calendarEvent.name',
        type: 'calendar',
        ready: true,
        label: EVENT_NAME_VARIABLE,
        data: {}
      },
      {
        name: 'calendarEvent.location',
        type: 'calendar',
        ready: true,
        label: EVENT_LOCATION_VARIABLE,
        data: {}
      },
      {
        name: 'calendarEvent.description',
        type: 'calendar',
        ready: true,
        label: EVENT_DESCRIPTION_VARIABLE,
        data: {}
      },
      {
        name: 'calendarEvent.start',
        type: 'calendar',
        ready: true,
        label: EVENT_START_VARIABLE,
        data: {}
      },
      {
        name: 'calendarEvent.end',
        type: 'calendar',
        ready: true,
        label: EVENT_END_VARIABLE,
        data: {}
      }
    ]);
  };

  initTriggerIfNeeded = () => {
    if (isNullOrUndefined(get(this.props, 'trigger.unit'))) {
      this.props.updateTriggerProperty(this.props.index, 'unit', 'minute');
    }
    if (isNullOrUndefined(get(this.props, 'trigger.duration'))) {
      this.props.updateTriggerProperty(this.props.index, 'duration', 0);
    }
    if (isNullOrUndefined(get(this.props, 'trigger.calendar_event_attribute'))) {
      this.props.updateTriggerProperty(this.props.index, 'calendar_event_attribute', 'start');
    }
    if (isNullOrUndefined(get(this.props, 'trigger.calendar_event_name_comparator'))) {
      this.props.updateTriggerProperty(this.props.index, 'calendar_event_name_comparator', 'contains');
    }
    if (isNullOrUndefined(get(this.props, 'trigger.calendars'))) {
      this.props.updateTriggerProperty(this.props.index, []);
    }
  };

  componentDidMount() {
    this.initTriggerIfNeeded();
    this.getCalendars();
    this.setVariables();
  }

  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps.trigger);
  }

  render({ trigger }, { calendarsOptions, selectedCalendarsOptions }) {
    return (
      <div>
        <div class="row">
          <div class="col-md-12">
            <p>
              <Text id="editScene.triggersCard.calendarEventIsComing.description" />
            </p>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12">
            <div class="form-group">
              <div class="form-label">
                <Text id="editScene.triggersCard.calendarEventIsComing.calendarLabel" />
              </div>
              <Select
                defaultValue={null}
                value={selectedCalendarsOptions}
                isMulti
                onChange={this.updateCalendars}
                options={calendarsOptions}
              />
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-sm-4">
            <div class="form-group">
              <div class="form-label">
                <Text id="editScene.triggersCard.calendarEventIsComing.nameLabel" />
              </div>
              <select
                class="form-control"
                onChange={this.handleComparator}
                value={trigger.calendar_event_name_comparator}
              >
                <option value="is-exactly">
                  <Text id="editScene.triggersCard.calendarEventIsComing.isExactly" />
                </option>
                <option value="contains">
                  <Text id="editScene.triggersCard.calendarEventIsComing.contains" />
                </option>
                <option value="starts-with">
                  <Text id="editScene.triggersCard.calendarEventIsComing.startsWith" />
                </option>
                <option value="ends-with">
                  <Text id="editScene.triggersCard.calendarEventIsComing.endsWith" />
                </option>
                <option value="has-any-name">
                  <Text id="editScene.triggersCard.calendarEventIsComing.hasAnyName" />
                </option>
              </select>
            </div>
          </div>
          {trigger.calendar_event_name_comparator !== 'has-any-name' && (
            <div class="col-sm-8">
              <Localizer>
                <input
                  type="text"
                  class={cx('form-control', style.calendarEventIsComingMarginInputMargin)}
                  onChange={this.handleNameChange}
                  value={trigger.calendar_event_name}
                  placeholder={<Text id="editScene.triggersCard.calendarEventIsComing.namePlaceholder" />}
                />
              </Localizer>
            </div>
          )}
        </div>
        <div class={cx('row', style.calendarEventIsComingGroupMargin)}>
          <div class="col-sm-4">
            <div class="form-group">
              <div class="form-label">
                <Text id="editScene.triggersCard.calendarEventIsComing.durationName" />
              </div>
              <select
                class="form-control"
                onChange={this.handleCalendarEventAttributeChange}
                value={trigger.calendar_event_attribute}
              >
                <option value="start">
                  <Text id="editScene.triggersCard.calendarEventIsComing.startingIn" />
                </option>
                <option value="end">
                  <Text id="editScene.triggersCard.calendarEventIsComing.endingIn" />
                </option>
              </select>
            </div>
          </div>

          <div class="col-sm-4">
            <div class="form-group">
              <Localizer>
                <input
                  class={cx('form-control', style.calendarEventIsComingMarginInputMargin)}
                  type="number"
                  onChange={this.handleDurationChange}
                  value={trigger.duration}
                  placeholder={<Text id="editScene.triggersCard.calendarEventIsComing.durationPlaceholder" />}
                />
              </Localizer>
            </div>
          </div>
          <div class="col-sm-4">
            <div class="form-group">
              <select
                class={cx('form-control', style.calendarEventIsComingMarginInputMargin)}
                onChange={this.handleUnitChange}
                value={trigger.unit}
              >
                <option value="minute">
                  <Text id="editScene.triggersCard.calendarEventIsComing.minute" />
                </option>
                <option value="hour">
                  <Text id="editScene.triggersCard.calendarEventIsComing.hour" />
                </option>
                <option value="day">
                  <Text id="editScene.triggersCard.calendarEventIsComing.day" />
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient,user', {})(withIntlAsProp(CalendarEventIsComing));
