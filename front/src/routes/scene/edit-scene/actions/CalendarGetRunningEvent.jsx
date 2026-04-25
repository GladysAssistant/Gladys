import Select from 'react-select';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { RequestStatus } from '../../../../utils/consts';
import { Text, Localizer } from 'preact-i18n';

import get from 'get-value';
import cx from 'classnames';

import withIntlAsProp from '../../../../utils/withIntlAsProp';
import style from './CalendarIsEventRunning.css';

const isNullOrUndefined = variable => variable === null || variable === undefined;

class CalendarGetRunningEvent extends Component {
  getCalendars = async () => {
    this.setState({ status: RequestStatus.Getting });
    try {
      const calendars = await this.props.httpClient.get('/api/v1/calendar', { shared: true });
      const calendarsOptions = calendars.map(calendar => ({
        value: calendar.selector,
        label: calendar.name
      }));
      await this.setState({ calendarsOptions, status: RequestStatus.Success });
      this.refreshSelectedOptions(this.props.action);
    } catch (e) {
      this.setState({ status: RequestStatus.Error });
    }
  };

  updateCalendars = selectedCalendarsOptions => {
    const calendars = selectedCalendarsOptions.map(o => o.value);
    this.props.updateActionProperty(this.props.path, 'calendars', calendars);
  };

  handleComparator = e => {
    if (e.target.value) {
      this.props.updateActionProperty(this.props.path, 'calendar_event_name_comparator', e.target.value);
    } else {
      this.props.updateActionProperty(this.props.path, 'calendar_event_name_comparator', null);
    }
  };

  handleNameChange = e => {
    this.props.updateActionProperty(this.props.path, 'calendar_event_name', e.target.value);
  };

  setVariables = () => {
    const EVENT_NAME_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.calendar.eventName');
    const EVENT_LOCATION_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.calendar.eventLocation');
    const EVENT_DESCRIPTION_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.calendar.eventDescription');
    const EVENT_START_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.calendar.eventStart');
    const EVENT_END_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.calendar.eventEnd');
    this.props.setVariables(this.props.path, [
      { name: 'calendarEvent.name', type: 'calendar', ready: true, label: EVENT_NAME_VARIABLE, data: {} },
      { name: 'calendarEvent.location', type: 'calendar', ready: true, label: EVENT_LOCATION_VARIABLE, data: {} },
      { name: 'calendarEvent.description', type: 'calendar', ready: true, label: EVENT_DESCRIPTION_VARIABLE, data: {} },
      { name: 'calendarEvent.start', type: 'calendar', ready: true, label: EVENT_START_VARIABLE, data: {} },
      { name: 'calendarEvent.end', type: 'calendar', ready: true, label: EVENT_END_VARIABLE, data: {} }
    ]);
  };

  initActionIfNeeded = () => {
    if (isNullOrUndefined(this.props.action.calendar_event_name_comparator)) {
      this.props.updateActionProperty(this.props.path, 'calendar_event_name_comparator', 'has-any-name');
    }
    if (isNullOrUndefined(this.props.action.calendars)) {
      this.props.updateActionProperty(this.props.path, 'calendars', []);
    }
  };

  refreshSelectedOptions = action => {
    const selectedCalendarsOptions = [];
    if (action.calendars && this.state.calendarsOptions) {
      action.calendars.forEach(calendar => {
        const calendarOption = this.state.calendarsOptions.find(o => o.value === calendar);
        if (calendarOption) {
          selectedCalendarsOptions.push(calendarOption);
        }
      });
    }
    this.setState({ selectedCalendarsOptions });
  };

  componentDidMount() {
    this.initActionIfNeeded();
    this.getCalendars();
    this.setVariables();
  }

  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps.action);
  }

  render({ action }, { selectedCalendarsOptions, calendarsOptions }) {
    return (
      <div>
        <div class="row">
          <div class="col-md-12">
            <p>
              <Text id="editScene.actionsCard.calendarGetRunningEvent.description" />
            </p>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12">
            <div class="form-group">
              <div class="form-label">
                <Text id="editScene.actionsCard.calendarGetRunningEvent.calendarLabel" />
              </div>
              <Select
                defaultValue={null}
                value={selectedCalendarsOptions}
                isMulti
                onChange={this.updateCalendars}
                options={calendarsOptions}
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-sm-4">
            <div class="form-group">
              <div class="form-label">
                <Text id="editScene.actionsCard.calendarGetRunningEvent.nameLabel" />
              </div>
              <select
                class="form-control"
                onChange={this.handleComparator}
                value={action.calendar_event_name_comparator}
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
          {action.calendar_event_name_comparator !== 'has-any-name' && (
            <div class="col-sm-8">
              <Localizer>
                <input
                  type="text"
                  class={cx('form-control', style.calendarEventIsComingMarginInputMargin)}
                  onChange={this.handleNameChange}
                  value={action.calendar_event_name}
                  placeholder={<Text id="editScene.actionsCard.calendarGetRunningEvent.namePlaceholder" />}
                />
              </Localizer>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default connect('user,httpClient', {})(withIntlAsProp(CalendarGetRunningEvent));
