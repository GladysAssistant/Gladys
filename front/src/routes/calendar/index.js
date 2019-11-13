import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../../actions/calendar';

import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';

import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

@connect('eventsFormated', actions, moment)
class Map extends Component {
  onRangeChange = range => {
    let from, to;

    if (Array.isArray(range)) {
      from = moment(range[0])
        .subtract(1, 'day')
        .toDate();
      to = moment(range[range.length - 1])
        .add(1, 'day')
        .toDate();
    } else {
      from = moment(range.start)
        .subtract(1, 'day')
        .toDate();
      to = moment(range.end)
        .add(1, 'day')
        .toDate();
    }
    this.props.getEventsInRange(from, to);
  };

  componentWillMount() {
    const from = moment()
      .startOf('month')
      .subtract(7, 'day')
      .toDate();
    const to = moment()
      .endOf('month')
      .add(7, 'day')
      .toDate();
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
                        defaultView="week"
                        culture={navigator.language}
                        messages={this.context.intl.dictionary.calendar}
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

export default Map;
