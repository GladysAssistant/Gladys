import Select from 'react-select';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { RequestStatus } from '../../../../utils/consts';
import { Text, Localizer } from 'preact-i18n';
import get from 'get-value';

import withIntlAsProp from '../../../../utils/withIntlAsProp';

const isNullOrUndefined = variable => variable === null || variable === undefined;

class CalendarGetEvents extends Component {
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
      this.refreshSelectedOptions(this.props.action);
    } catch (e) {
      this.setState({
        status: RequestStatus.Error
      });
    }
  };
  updateCalendars = selectedCalendarsOptions => {
    const calendars = selectedCalendarsOptions.map(o => o.value);
    this.props.updateActionProperty(this.props.path, 'calendars', calendars);
  };
  handleTimeRangeChange = e => {
    this.props.updateActionProperty(this.props.path, 'time_range', e.target.value);
  };
  handleDurationChange = e => {
    const duration = parseInt(e.target.value, 10);
    this.props.updateActionProperty(this.props.path, 'duration', Number.isNaN(duration) ? null : duration);
  };
  handleStopSceneIfNoEvents = e => {
    this.props.updateActionProperty(this.props.path, 'stop_scene_if_no_events', e.target.value === 'stop');
  };

  refreshSelectedOptions = action => {
    const selectedCalendarsOptions = [];
    if (action.calendars && this.state.calendarsOptions) {
      action.calendars.forEach(calendar => {
        const calendarOption = this.state.calendarsOptions.find(calendarOption => calendarOption.value === calendar);
        if (calendarOption) {
          selectedCalendarsOptions.push(calendarOption);
        }
      });
    }
    this.setState({ selectedCalendarsOptions });
  };

  initActionIfNeeded = () => {
    if (isNullOrUndefined(get(this.props, 'action.calendars'))) {
      this.props.updateActionProperty(this.props.path, 'calendars', []);
    }
    if (isNullOrUndefined(get(this.props, 'action.time_range'))) {
      this.props.updateActionProperty(this.props.path, 'time_range', 'tomorrow');
    }
    if (isNullOrUndefined(get(this.props, 'action.stop_scene_if_no_events'))) {
      this.props.updateActionProperty(this.props.path, 'stop_scene_if_no_events', false);
    }
  };

  setVariables = () => {
    const EVENTS_TEXT_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.calendarEvents.text');
    const EVENTS_COUNT_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.calendarEvents.count');
    this.props.setVariables(this.props.path, [
      {
        name: 'calendarEvents.text',
        type: 'calendar',
        ready: true,
        label: EVENTS_TEXT_VARIABLE,
        data: {}
      },
      {
        name: 'calendarEvents.count',
        type: 'calendar',
        ready: true,
        label: EVENTS_COUNT_VARIABLE,
        data: {}
      }
    ]);
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
              <Text id="editScene.actionsCard.calendarGetEvents.description" />
            </p>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12">
            <div class="form-group">
              <div class="form-label">
                <Text id="editScene.actionsCard.calendarGetEvents.calendarLabel" />
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
          <div class={action.time_range === 'next-x-hours' ? 'col-sm-6' : 'col-sm-12'}>
            <div class="form-group">
              <div class="form-label">
                <Text id="editScene.actionsCard.calendarGetEvents.timeRangeLabel" />
              </div>
              <select class="form-control" onChange={this.handleTimeRangeChange} value={action.time_range}>
                <option value="today">
                  <Text id="editScene.actionsCard.calendarGetEvents.today" />
                </option>
                <option value="tomorrow">
                  <Text id="editScene.actionsCard.calendarGetEvents.tomorrow" />
                </option>
                <option value="next-x-hours">
                  <Text id="editScene.actionsCard.calendarGetEvents.nextXHours" />
                </option>
              </select>
            </div>
          </div>
          {action.time_range === 'next-x-hours' && (
            <div class="col-sm-6">
              <div class="form-group">
                <div class="form-label">
                  <Text id="editScene.actionsCard.calendarGetEvents.durationLabel" />
                </div>
                <Localizer>
                  <input
                    type="number"
                    min="1"
                    class="form-control"
                    onChange={this.handleDurationChange}
                    value={action.duration}
                    placeholder={<Text id="editScene.actionsCard.calendarGetEvents.durationPlaceholder" />}
                  />
                </Localizer>
              </div>
            </div>
          )}
        </div>
        <div class="row">
          <div class="col-sm-12">
            <div class="form-group">
              <div class="form-label">
                <Text id="editScene.actionsCard.calendarGetEvents.whenNoEventsLabel" />
              </div>
              <select
                class="form-control"
                onChange={this.handleStopSceneIfNoEvents}
                value={action.stop_scene_if_no_events ? 'stop' : 'continue'}
              >
                <option value="continue">
                  <Text id="editScene.actionsCard.calendarGetEvents.continueScene" />
                </option>
                <option value="stop">
                  <Text id="editScene.actionsCard.calendarGetEvents.stopScene" />
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('user,httpClient', {})(withIntlAsProp(CalendarGetEvents));
