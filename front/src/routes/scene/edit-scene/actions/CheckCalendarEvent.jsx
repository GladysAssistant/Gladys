import Select from 'react-select';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';

import { ACTIONS } from '../../../../../../server/utils/constants';

@connect('httpClient', {})
class CheckCalendarEvent extends Component {
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
  handleChange = selectedOption => {
    if (selectedOption && selectedOption.value) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'user', selectedOption.value);
    } else {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'user', null);
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
    let selectedOption = '';
    let selectedCalendarOption = '';
    if (nextProps.action.user && this.state.userOptions) {
      const userOption = this.state.userOptions.find(option => option.value === nextProps.action.user);

      if (userOption) {
        selectedOption = userOption;
      }
    }
    if (nextProps.action.calendar && this.state.calendarOptions) {
      const calendarOption = this.state.calendarOptions.find(option => option.value === nextProps.action.calendar);

      if (calendarOption) {
        selectedCalendarOption = calendarOption;
      }
    }
    this.setState({ selectedOption, selectedCalendarOption, event: nextProps.action.event });
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      selectedOption: '',
      selectedCalendarOption: '',
      event: ''
    };
  }
  componentDidMount() {
    this.getOptions();
  }
  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }
  render(props, { selectedOption, userOptions, calendarOptions, selectedCalendarOption, event }) {
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
            <Text id="editScene.actionsCard.checkCalendarEvent.userLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Select options={userOptions} value={selectedOption} onChange={this.handleChange} />
        </div>
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
