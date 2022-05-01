import { Component } from 'preact';
import { connect } from 'unistore/preact';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { default as ReactClock } from 'react-clock';
dayjs.extend(localizedFormat);

import { CLOCK_TYPES } from '../../../../../server/utils/constants';
import { Text } from 'preact-i18n';

const padding = {
  paddingLeft: '20px',
  paddingRight: '20px',
  paddingTop: '10px',
  paddingBottom: '10px'
};

const Clock = ({ children, ...props }) => (
  <div class="card">
    {props.clockType === CLOCK_TYPES.ANALOG && (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          padding: '16px'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 'auto'
          }}
        >
          <div
            style={{
              fontSize: '18px',
              textAlign: 'left'
            }}
          >
            {props.day}
          </div>
          <div
            style={{
              fontSize: '40px',
              textAlign: 'left'
            }}
          >
            <Text id="dashboard.boxes.clock.smallDate" fields={{ month: props.month, dayNumber: props.dayNumber }} />
          </div>
          <div
            style={{
              fontSize: '18px',
              textAlign: 'left'
            }}
          >
            {props.year}
          </div>
        </div>

        <div
          style={{
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ReactClock className={'react-clock'} value={props.time} />
        </div>
      </div>
    )}
    {props.clockType === CLOCK_TYPES.DIGITAL && (
      <div style={padding}>
        <div
          style={{
            fontSize: '40px',
            lineHeight: '1.2',
            textAlign: 'center'
          }}
          class="font-size-40 blue-grey-700"
        >
          {props.time}
        </div>
        <div
          style={{
            paddingTop: '10px',
            fontSize: '16px',
            textAlign: 'center'
          }}
        >
          <Text
            id="dashboard.boxes.clock.date"
            fields={{ day: props.day, month: props.month, dayNumber: props.dayNumber, year: props.year }}
          />
        </div>
      </div>
    )}
  </div>
);

class ClockComponent extends Component {
  refreshTime = () => {
    let month = dayjs()
      .locale(this.props.user.language)
      .format('MMMM');
    month = month.charAt(0).toUpperCase() + month.slice(1);

    let day = dayjs()
      .locale(this.props.user.language)
      .format('dddd');
    day = day.charAt(0).toUpperCase() + day.slice(1);

    const dayNumber = dayjs()
      .locale(this.props.user.language)
      .format('D');

    const year = dayjs()
      .locale(this.props.user.language)
      .format('YYYY');

    const time = dayjs()
      .locale(this.props.user.language)
      .format('LTS');
    this.setState({ day, dayNumber, month, year, time });
  };
  componentDidMount() {
    this.interval = setInterval(() => {
      this.refreshTime();
    }, 1000);
    this.refreshTime();
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render(props, { day, dayNumber, month, year, time }) {
    return (
      <Clock
        day={day}
        dayNumber={dayNumber}
        month={month}
        year={year}
        time={time}
        clockType={props.box.clock_type}
        language={props.user.language}
      />
    );
  }
}

export default connect('user', {})(ClockComponent);
