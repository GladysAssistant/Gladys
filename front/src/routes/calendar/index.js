import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../../actions/calendar';

import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';

import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

@connect(
  'eventsFormated',
  actions,
  moment
)
class Map extends Component {
  onRangeChange = range => {
    let from, to;

    if (Array.isArray(range)) {
      from = moment(range[0]).subtract(1, 'day').toDate();
      to = moment(range[range.length-1]).add(1, 'day').toDate();
    } else {
      from = moment(range.start).subtract(1, 'day').toDate();
      to = moment(range.end).add(1, 'day').toDate();
    }
    this.props.getEventsInRange(from, to);
  }

  componentWillMount() {
    const from = moment().startOf('month').subtract(7, 'day').toDate();
    const to = moment().endOf('month').add(7, 'day').toDate();
    this.props.getEventsInRange(from, to);
  }

  render(props, {}) {
    return (
      <div class="page">
        <div class="page-main">
          <div class="my-3 my-md-5">
            <div class="container">
              <div class="row">
                <div class="col-md-12">
                  <div class="card">
                    <div class="card-body">
                      <Calendar
                        localizer={localizer}
                        events={props.eventsFormated || []}
                        style={{
                          height: '550px'
                        }}
                        onRangeChange={this.onRangeChange}
                        selectable
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

/*function getTimeTemplate(schedule, isAllDay) {
  const html = [];
  const start = day(schedule.start.toUTCString());
  if (!isAllDay) {
    html.push('<strong>' + start.format('HH:mm') + '</strong> ');
  }
  if (schedule.isPrivate) {
    html.push('<span class="calendar-font-icon ic-lock-b"></span>');
    html.push(' Private');
  } else {
    if (schedule.isReadOnly) {
      html.push('<span class="calendar-font-icon ic-readonly-b"></span>');
    } else if (schedule.recurrenceRule) {
      html.push('<span class="calendar-font-icon ic-repeat-b"></span>');
    } else if (schedule.attendees.length > 0) {
      html.push('<span class="calendar-font-icon ic-user-b"></span>');
    } else if (schedule.location) {
      html.push('<span class="calendar-font-icon ic-location-b"></span>');
    }
    html.push(' ' + schedule.title);
  }

  return html.join('');
} */

/*
@connect(
  '',
  actions
)
class Map extends Component {

  componentDidMount() {
    this.calendar = new Calendar('#calendar', {
      defaultView: 'month',
      taskView: true,
      useCreationPopup: true,
      useDetailPopup: true,
      timezones: [{
        timezoneOffset: 420,
        displayLabel: 'GMT+08:00',
        tooltip: 'Hong Kong'
      }],
      template: {
        monthGridHeader(model) {
          const date = new Date(model.date);
          const template = '<span class="tui-full-calendar-weekday-grid-date">' + date.getDate() + '</span>';
          return template;
        },
        milestone(model) {
          return '<span class="calendar-font-icon ic-milestone-b"></span> <span style="background-color: ' + model.bgColor + '">' + model.title + '</span>';
        }
      }
    });
    this.renderCal();
  }

  componentWillUnmount() {
    this.calendar.destroy();
  }

  renderCal() {
    this.calendar.clear();
    this.calendar.createSchedules([
      {
        id: '1',
        calendarId: '1',
        title: 'my schedule',
        category: 'time',
        dueDateClass: '',
        start: '2018-01-18T22:30:00+09:00',
        end: '2018-01-19T02:30:00+09:00'
      },
      {
        id: '2',
        calendarId: '1',
        title: 'second schedule',
        category: 'time',
        dueDateClass: '',
        start: '2018-01-18T17:30:00+09:00',
        end: '2018-01-19T17:31:00+09:00'
      }
    ]);
    this.calendar.render();
  }

  render({}, { }) {
    return (
      <div class="page">
        <div class="page-main">
          <div class="my-3 my-md-5">
            <div class="container">
              <div class="row">
                <div class="col-md-12">
                  <div class="card">
                    <div class="card-body">
                      <div id="calendar" style="height: 800px;" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
} */

export default Map;
