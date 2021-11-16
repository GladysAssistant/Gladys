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
      const calendars = await this.props.httpClient.get('/api/v1/calendar', {
        shared: true
      });
      const calendarOptions = [];
      calendars.forEach(calendar => {
        calendarOptions.push({
          label: calendar.name,
          value: calendar.id
        });
      });
      await this.setState({ calendarOptions });
      this.refreshSelectedOptions(this.props);
      return calendarOptions;
    } catch (e) {
      console.error(e);
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
    let selectedCalendarOption = '';
    if (nextProps.trigger.calendar && this.state.calendarOptions) {
      const calendarOption = this.state.calendarOptions.find(option => option.value === nextProps.trigger.calendar);

      if (calendarOption) {
        selectedCalendarOption = calendarOption;
      }
    }
    this.setState({ selectedCalendarOption });
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      selectedCalendarOption: ''
    };
    this.props.updateTriggerProperty(this.props.index, 'user', this.props.user.id);
  }
  componentDidMount() {
    this.getOptions();
  }
  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }

  render(props, { calendarOptions, selectedCalendarOption }) {
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
