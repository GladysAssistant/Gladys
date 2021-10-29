import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';

import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import { EVENTS } from '../../../../../../server/utils/constants';

@connect('httpClient,user', {})
class CalendarEventTrigger extends Component {
  getOptions = async () => {
    try {
      const [users, calendars] = await Promise.all([
        this.props.httpClient.get('/api/v1/user'),
        this.props.httpClient.get('/api/v1/calendar')
      ]);
      const userOptions = [];
      users.forEach(user => {
        userOptions.push({
          label: user.firstname,
          value: user.selector
        });
      });
      const calendarOptions = [];
      calendars.forEach(calendar => {
        calendarOptions.push({
          label: calendar.name,
          value: calendar.selector
        });
      });
      await this.setState({ userOptions, calendarOptions });
      this.refreshSelectedOptions(this.props);
      return userOptions;
    } catch (e) {
      console.error(e);
    }
  };

  handleUserChange = selectedOption => {
    if (selectedOption && selectedOption.value) {
      this.props.updateTriggerProperty(this.props.index, 'user', selectedOption.value);
    } else {
      this.props.updateTriggerProperty(this.props.index, 'user', null);
    }
  };
  handleCalendarChange = selectedOption => {
    if (selectedOption && selectedOption.value) {
      this.props.updateTriggerProperty(this.props.index, 'calendar', selectedOption.value);
    } else {
      this.props.updateTriggerProperty(this.props.index, 'calendar', null);
    }
  };
  handleEventChange = e => {
    let value = e.target.value;
    this.props.updateTriggerProperty(this.props.index, 'event', value);
  };
  refreshSelectedOptions = nextProps => {
    let selectedOption = '';
    let selectedCalendarOption = '';
    if (nextProps.trigger.user && this.state.userOptions) {
      const userOption = this.state.userOptions.find(option => option.value === nextProps.trigger.user);

      if (userOption) {
        selectedOption = userOption;
      }
    }
    if (nextProps.trigger.calendar && this.state.calendarOptions) {
      const calendarOption = this.state.calendarOptions.find(option => option.value === nextProps.trigger.calendar);

      if (calendarOption) {
        selectedCalendarOption = calendarOption;
      }
    }
    this.setState({ selectedOption, selectedCalendarOption });
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      selectedOption: '',
      selectedCalendarOption: ''
    };
  }
  componentDidMount() {
    this.getOptions();
  }
  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }

  render(props, { userOptions, selectedOption, calendarOptions, selectedCalendarOption }) {
    return (
      <div>
        <p>
          {props.trigger.type === EVENTS.CALENDAR.EVENT_START && (
            <Text id="editScene.triggersCard.calendar.eventStartDescription" />
          )}
          {props.trigger.type === EVENTS.CALENDAR.EVENT_REMINDER && (
            <Text id="editScene.triggersCard.calendar.eventReminderDescription" />
          )}
          {props.trigger.type === EVENTS.CALENDAR.EVENT_END && (
            <Text id="editScene.triggersCard.calendar.eventEndDescription" />
          )}
        </p>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.triggersCard.calendar.userLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Select options={userOptions} value={selectedOption} onChange={this.handleUserChange} />
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.triggersCard.calendar.calendarLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Select options={calendarOptions} value={selectedCalendarOption} onChange={this.handleCalendarChange} />
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.triggersCard.calendar.eventLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Localizer>
            <input
              type="text"
              class="form-control"
              placeholder={<Text id="editScene.triggersCard.calendar.eventPlaceholder" />}
              value={props.trigger.event}
              onChange={this.handleEventChange}
            />
          </Localizer>
        </div>
      </div>
    );
  }
}

export default CalendarEventTrigger;
