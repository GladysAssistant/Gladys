import { Component } from 'preact';
import { connect } from 'unistore/preact';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
dayjs.extend(localizedFormat);

const Clock = ({ children, ...props }) => (
  <div class="card">
    <div className="card-header">
      <h3 className="card-title">{props.date}</h3>
    </div>
    <div
      class="card-body o-auto"
      style={{
        textAlign: 'center',
        fontSize: '30px'
      }}
    >
      {props.time}
    </div>
  </div>
);

class ClockComponent extends Component {
  refreshTime = () => {
    const date = dayjs()
      .locale(this.props.user.language)
      .format('LL');
    const time = dayjs()
      .locale(this.props.user.language)
      .format('LTS');
    this.setState({ date, time });
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

  render(props, { date, time }) {
    return <Clock date={date} time={time} />;
  }
}

export default connect('user', {})(ClockComponent);
