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
      from = dayjs(range[0])
        .subtract(7, 'day')
        .toDate();
      to = dayjs(range[range.length - 1])
        .add(7, 'day')
        .toDate();
    } else {
      from = dayjs(range.start)
        .subtract(7, 'day')
        .toDate();
      to = dayjs(range.end)
        .add(7, 'day')
        .toDate();
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

  componentWillMount() {
    dayjs.locale(this.props.user.language);

    const from = dayjs()
      .startOf('week')
      .subtract(7, 'day')
      .toDate();
    const to = dayjs()
      .endOf('week')
      .add(7, 'day')
      .toDate();
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
                        defaultView="week"
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
