import { Component } from 'preact';
import { connect } from 'unistore/preact';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { default as ReactClock } from 'react-clock';
dayjs.extend(localizedFormat);

import { CLOCK_TYPES } from './ClockTypes';
import { Text } from 'preact-i18n';
import style from './style.css';
import get from 'get-value';
import cx from 'classnames';

const Clock = ({ children, ...props }) => (
  <div class="card">
    {props.clockType === CLOCK_TYPES.ANALOG && (
      <div class={style.analogRow}>
        <div class={style.analogCol}>
          <div class={style.analogSmallText}>{props.day}</div>
          <div class={style.analogBigText}>
            <Text id="dashboard.boxes.clock.smallDate" fields={{ month: props.month, dayNumber: props.dayNumber }} />
          </div>
          <div class={style.analogSmallText}>{props.year}</div>
        </div>
        <div class={style.analogCol}>
          <div class={style.analogClock}>
            <ReactClock className={style.reactClock} value={props.time} renderSecondHand={props.displaySecond} />
          </div>
        </div>
      </div>
    )}
    {props.clockType === CLOCK_TYPES.DIGITAL && (
      <div class={style.padding}>
        <div class={cx(style.digitalTime, 'text-monospace')}>{props.time}</div>
        <div class={style.digitalDate}>
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

    const displaySecond = get(this.props, 'box.clock_display_second', false);

    const time = dayjs()
      .locale(this.props.user.language)
      .format(displaySecond ? 'LTS' : 'LT');

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
    const clockType = get(props, 'box.clock_type', CLOCK_TYPES.ANALOG);
    const displaySecond = get(props, 'box.clock_display_second', false);
    return (
      <Clock
        day={day}
        dayNumber={dayNumber}
        month={month}
        year={year}
        time={time}
        clockType={clockType}
        displaySecond={displaySecond}
        language={props.user.language}
      />
    );
  }
}

export default connect('user', {})(ClockComponent);
