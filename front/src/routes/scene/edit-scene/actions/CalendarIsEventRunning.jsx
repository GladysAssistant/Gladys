import Select from 'react-select';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { RequestStatus } from '../../../../utils/consts';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import withIntlAsProp from '../../../../utils/withIntlAsProp';

import style from './CalendarIsEventRunning.css';

const isNullOrUndefined = variable => variable === null || variable === undefined;

class CheckTime extends Component {
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
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'calendars', calendars);
  };
  handleComparator = e => {
    if (e.target.value) {
      this.props.updateActionProperty(
        this.props.columnIndex,
        this.props.index,
        'calendar_event_name_comparator',
        e.target.value
      );
    } else {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'calendar_event_name_comparator', null);
    }
  };

  handleNameChange = e => {
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'calendar_event_name', e.target.value);
  };

  handleStopSceneIfEventFound = e => {
    const foundValue = e.target.value === 'stop';
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'stop_scene_if_event_found', foundValue);
    this.props.updateActionProperty(
      this.props.columnIndex,
      this.props.index,
      'stop_scene_if_event_not_found',
      !foundValue
    );
  };

  initVariables = action => {
    if (action.stop_scene_if_event_found === false) {
      this.setVariables();
    } else {
      this.removeVariables();
    }
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
    if (get(this.props, 'action.stop_scene_if_event_found') !== action.stop_scene_if_event_found) {
      this.initVariables(action);
    }

    this.setState({ selectedCalendarsOptions });
  };

  initActionIfNeeded = () => {
    if (isNullOrUndefined(get(this.props, 'action.calendar_event_name_comparator'))) {
      this.props.updateActionProperty(
        this.props.columnIndex,
        this.props.index,
        'calendar_event_name_comparator',
        'contains'
      );
    }
    if (isNullOrUndefined(get(this.props, 'action.calendars'))) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'calendars', []);
    }
    if (isNullOrUndefined(get(this.props, 'action.stop_scene_if_event_found'))) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'stop_scene_if_event_found', false);
    }
    if (isNullOrUndefined(get(this.props, 'action.stop_scene_if_event_not_found'))) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'stop_scene_if_event_not_found', true);
    }
  };

  setVariables = () => {
    const { columnIndex, index } = this.props;
    const EVENT_NAME_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.calendar.eventName');
    const EVENT_LOCATION_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.calendar.eventLocation');
    const EVENT_DESCRIPTION_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.calendar.eventDescription');
    const EVENT_START_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.calendar.eventStart');
    const EVENT_END_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.calendar.eventEnd');
    this.props.setVariables(columnIndex, index, [
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

  removeVariables = () => {
    const { columnIndex, index } = this.props;
    this.props.setVariables(columnIndex, index, []);
  };

  componentDidMount() {
    this.initActionIfNeeded();
    this.getCalendars();
    this.initVariables(this.props.action);
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
              <Text id="editScene.actionsCard.calendarEventIsRunning.description" />
            </p>
          </div>
        </div>
        <div class="row">
          <div class="col-md-12">
            <div class="form-group">
              <div class="form-label">
                <Text id="editScene.actionsCard.calendarEventIsRunning.calendarLabel" />
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
                <Text id="editScene.actionsCard.calendarEventIsRunning.nameLabel" />
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
                  placeholder={<Text id="editScene.actionsCard.calendarEventIsRunning.namePlaceholder" />}
                />
              </Localizer>
            </div>
          )}
        </div>
        <div class={cx('row', style.calendarEventIsComingGroupMargin)}>
          <div class="col-sm-6">
            <div class="form-group">
              <div class="form-label">
                <Text id="editScene.actionsCard.calendarEventIsRunning.whenFoundLabel" />
              </div>
              <select
                class="form-control"
                onChange={this.handleStopSceneIfEventFound}
                value={action.stop_scene_if_event_found ? 'stop' : 'continue'}
              >
                <option value="stop">
                  <Text id="editScene.actionsCard.calendarEventIsRunning.stopScene" />
                </option>
                <option value="continue">
                  <Text id="editScene.actionsCard.calendarEventIsRunning.continueScene" />
                </option>
              </select>
            </div>
          </div>
          <div class="col-sm-6">
            <div class="form-group">
              <div class="form-label">
                <Text id="editScene.actionsCard.calendarEventIsRunning.whenNotFoundLabel" />
              </div>
              <select class="form-control" disabled value={action.stop_scene_if_event_not_found ? 'stop' : 'continue'}>
                <option value="stop">
                  <Text id="editScene.actionsCard.calendarEventIsRunning.stopScene" />
                </option>
                <option value="continue">
                  <Text id="editScene.actionsCard.calendarEventIsRunning.continueScene" />
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('user,httpClient', {})(withIntlAsProp(CheckTime));
