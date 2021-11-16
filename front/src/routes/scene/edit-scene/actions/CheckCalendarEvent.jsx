import Select from 'react-select';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';

import { ACTIONS } from '../../../../../../server/utils/constants';

@connect('httpClient,user', {})
class CheckCalendarEvent extends Component {
  getOptions = async () => {
    try {
      const calendars = await this.props.httpClient.get('/api/v1/calendar');
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
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'calendar', selectedOption.value);
    } else {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'calendar', null);
    }
  };
  handleEventChange = e => {
    let value = e.target.value;
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'event', value);
  };
  refreshSelectedOptions = nextProps => {
    let selectedCalendarOption = '';
    if (nextProps.action.calendar && this.state.calendarOptions) {
      const calendarOption = this.state.calendarOptions.find(option => option.value === nextProps.action.calendar);

      if (calendarOption) {
        selectedCalendarOption = calendarOption;
      }
    }
    this.setState({ selectedCalendarOption, event: nextProps.action.event });
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      selectedCalendarOption: '',
      event: ''
    };
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'user', this.props.user.id);
  }
  componentDidMount() {
    this.getOptions();
  }
  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }
  render(props, { calendarOptions, selectedCalendarOption, event }) {
    return (
      <div>
        <p>
          {props.action.type === ACTIONS.CALENDAR.EVENT && (
            <Text id="editScene.actionsCard.checkCalendarEvent.calendarEventDescription" />
          )}
          {props.action.type === ACTIONS.CALENDAR.NOT_EVENT && (
            <Text id="editScene.actionsCard.checkCalendarEvent.notCalendarEventDescription" />
          )}
        </p>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.checkCalendarEvent.calendarLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Select options={calendarOptions} value={selectedCalendarOption} onChange={this.handleCalendarChange} />
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.checkCalendarEvent.eventLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Localizer>
            <input
              type="text"
              class="form-control"
              placeholder={<Text id="editScene.actionsCard.checkCalendarEvent.eventPlaceholder" />}
              value={event}
              onChange={this.handleEventChange}
            />
          </Localizer>
        </div>
      </div>
    );
  }
}

export default CheckCalendarEvent;
