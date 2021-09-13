import { Component } from 'preact';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

class RelativeTime extends Component {
  refreshTimeDisplay = () => {
    if (this.props.datetime && this.props.language) {
      const relativeTime = dayjs(this.props.datetime)
        .locale(this.props.language)
        .fromNow();
      this.setState({
        relativeTime
      });
    }
  };

  constructor(props) {
    super(props);
    this.props;
    this.state = {
      relativeTime: ''
    };
  }

  componentDidMount() {
    this.refreshTimeDisplay();
    this.interval = setInterval(() => {
      this.refreshTimeDisplay();
    }, 60 * 1000);
  }

  componentDidUpdate(previousProps) {
    const dateTimeChanged = previousProps.datetime !== this.props.datetime;
    const languageChanged = previousProps.language !== this.props.language;
    if (dateTimeChanged || languageChanged) {
      this.refreshTimeDisplay();
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render(props, { relativeTime }) {
    return relativeTime;
  }
}

export default RelativeTime;
