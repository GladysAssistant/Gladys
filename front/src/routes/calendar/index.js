import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import dayjs from 'dayjs';
import actions from '../../actions/calendar';
import { isBright } from '../../utils/color';
import withIntlAsProp from '../../utils/withIntlAsProp';
import { Calendar, dayjsLocalizer } from 'react-big-calendar';

import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = dayjsLocalizer(dayjs);

class Map extends Component {
  onRangeChange = range => {
    let from, to;
    if (Array.isArray(range)) {
      from = dayjs(range[0]).toDate();
      to = dayjs(range[range.length - 1])
        .add(1, 'day')
        .toDate();
    } else {
      from = dayjs(range.start).toDate();
      to = dayjs(range.end).toDate();
    }
    this.props.getEventsInRange(from, to);
  };

  eventPropGetter = event =>
    event.color && {
      style: {
        backgroundColor: event.color,
        color: isBright(event.color) ? 'black' : 'white'
      }
    };

  onViewChange = newView => {
    localStorage.setItem('calendar_last_view', newView);
  };

  componentWillMount() {
    dayjs.locale(this.props.user.language);

    let from = dayjs()
      .startOf('week')
      .subtract(1, 'day')
      .toDate();
    let to = dayjs()
      .endOf('week')
      .add(1, 'day')
      .toDate();

    switch (localStorage.getItem('calendar_last_view')) {
      case 'month':
        from = dayjs()
          .startOf('month')
          .subtract(7, 'day')
          .toDate();
        to = dayjs()
          .endOf('month')
          .add(7, 'day')
          .toDate();
        break;
      case 'day':
        from = dayjs()
          .subtract(1, 'day')
          .toDate();
        to = dayjs()
          .add(1, 'day')
          .toDate();
        break;
      case 'agenda':
        from = dayjs().toDate();
        to = dayjs()
          .add(1, 'month')
          .toDate();
        break;
    }
    this.props.getEventsInRange(from, to);
  }

  render(props, {}) {
    const noCalendarConnected = props.calendars && props.calendars.length === 0;
    return (
      <div class="page">
        <div class="page-main">
          <div class="my-3 my-md-5">
            <div class="container">
              {noCalendarConnected && (
                <div class="alert alert-warning">
                  <Text id="calendar.noCalendarsConnected" />
                </div>
              )}
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
                        popup
                        onRangeChange={this.onRangeChange}
                        defaultView={localStorage.getItem('calendar_last_view') || 'week'}
                        onView={this.onViewChange}
                        culture={props.user.language}
                        messages={this.props.intl.dictionary.calendar}
                        scrollToTime={dayjs()
                          .subtract(2, 'hour')
                          .toDate()}
                        eventPropGetter={this.eventPropGetter}
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

export default connect('eventsFormated,calendars,user', actions, dayjs)(withIntlAsProp(Map));
